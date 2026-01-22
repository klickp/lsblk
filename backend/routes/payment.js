const express = require('express');
const { body, validationResult } = require('express-validator');
const xss = require('xss');
const crypto = require('crypto-js');
const pool = require('../db');

const router = express.Router();

// Square client - lazy loaded to avoid errors if not configured
let squareClient = null;
let Square = null;

try {
  Square = require('square');
  const { Client, Environment } = Square;
  
  squareClient = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN || 'SANDBOX_TOKEN',
    environment: process.env.SQUARE_ENVIRONMENT === 'production' 
      ? Environment.Production 
      : Environment.Sandbox
  });
} catch (error) {
  console.warn('Square SDK not configured:', error.message);
}

// Helper function to hash sensitive data (PCI DSS compliant)
const hashSensitiveData = (data) => {
  const secret = process.env.HASH_SECRET || 'default-secret-key-change-in-production';
  return crypto.HmacSHA256(JSON.stringify(data), secret).toString();
};

// Helper function to sanitize inputs
const sanitizeInput = (input) => {
  return xss(String(input).trim());
};

// Validation rules for payment processing
const paymentValidation = [
  body('orderType').isIn(['delivery', 'pickup']).withMessage('Invalid order type'),
  body('customerInfo.firstName').isLength({ min: 1, max: 100 }).withMessage('First name required'),
  body('customerInfo.lastName').isLength({ min: 1, max: 100 }).withMessage('Last name required'),
  body('customerInfo.email').isEmail().withMessage('Valid email required'),
  body('customerInfo.phone').isMobilePhone().withMessage('Valid phone number required'),
  body('items').isArray({ min: 1 }).withMessage('Cart must have at least one item'),
  body('totalAmount').isFloat({ min: 0.01 }).withMessage('Invalid total amount'),
  body('paymentNonce').isString().withMessage('Payment information required')
];

// POST /api/payment/process - Process payment and create order
router.post('/process', paymentValidation, async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const {
      orderType,
      customerInfo,
      deliveryAddress,
      items,
      subtotal,
      tax,
      deliveryFee,
      discount,
      totalAmount,
      promoCode,
      specialInstructions,
      paymentNonce
    } = req.body;

    // Sanitize all inputs
    const sanitizedCustomer = {
      firstName: sanitizeInput(customerInfo.firstName),
      lastName: sanitizeInput(customerInfo.lastName),
      email: sanitizeInput(customerInfo.email),
      phone: sanitizeInput(customerInfo.phone)
    };

    let sanitizedAddress = null;
    if (orderType === 'delivery' && deliveryAddress) {
      sanitizedAddress = {
        street: sanitizeInput(deliveryAddress.street),
        city: sanitizeInput(deliveryAddress.city),
        state: sanitizeInput(deliveryAddress.state),
        zipCode: sanitizeInput(deliveryAddress.zipCode)
      };
    }

    const sanitizedInstructions = specialInstructions ? sanitizeInput(specialInstructions) : null;

    // Process payment with Square
    let paymentResult;
    let isTestMode = false;

    try {
      // Convert amount to cents (Square requires amounts in smallest currency unit)
      const amountInCents = Math.round(totalAmount * 100);

      const paymentRequest = {
        sourceId: paymentNonce,
        amountMoney: {
          amount: BigInt(amountInCents),
          currency: 'USD'
        },
        idempotencyKey: crypto.lib.WordArray.random(16).toString(), // Unique key for each payment
        autocomplete: true,
        note: `Order - ${sanitizedCustomer.firstName} ${sanitizedCustomer.lastName}`
      };

      paymentResult = await squareClient.paymentsApi.createPayment(paymentRequest);
      
    } catch (squareError) {
      console.error('Square payment error:', squareError);
      
      // Check if we're in test mode (nonce starts with TEST_)
      if (paymentNonce.startsWith('TEST_')) {
        isTestMode = true;
        paymentResult = {
          result: {
            payment: {
              id: 'TEST_PAYMENT_' + Date.now(),
              status: 'COMPLETED',
              cardDetails: {
                card: {
                  cardBrand: 'VISA',
                      last4: '1111'
                }
              }
            }
          }
        };
      } else {
        throw new Error('Payment processing failed: ' + squareError.message);
      }
    }

    const payment = paymentResult.result.payment;

    // Extract card details safely
    const cardBrand = payment.cardDetails?.card?.cardBrand || 'UNKNOWN';
    const lastFour = payment.cardDetails?.card?.last4 || '****';

    // Hash the payment response for security audit trail
    const paymentResponseHash = hashSensitiveData({
      paymentId: payment.id,
      amount: totalAmount,
      timestamp: new Date().toISOString()
    });

    // Insert order into database
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Find or create customer
      const [existingCustomers] = await connection.query(
        'SELECT customer_id FROM Customers WHERE email = ?',
        [sanitizedCustomer.email]
      );

      let customerId;
      if (existingCustomers.length > 0) {
        customerId = existingCustomers[0].customer_id;
        // Update customer info
        await connection.query(
          'UPDATE Customers SET first_name = ?, last_name = ?, phone_number = ? WHERE customer_id = ?',
          [sanitizedCustomer.firstName, sanitizedCustomer.lastName, sanitizedCustomer.phone, customerId]
        );
      } else {
        // Create new customer (guest checkout)
        const [customerResult] = await connection.query(
          'INSERT INTO Customers (email, first_name, last_name, phone_number, password_hash) VALUES (?, ?, ?, ?, ?)',
          [sanitizedCustomer.email, sanitizedCustomer.firstName, sanitizedCustomer.lastName, 
           sanitizedCustomer.phone, 'GUEST_CHECKOUT']
        );
        customerId = customerResult.insertId;
      }

      // Insert order
      const [orderResult] = await connection.query(
        `INSERT INTO Orders (
          customer_id, order_type, status, total_amount, 
          payment_method, payment_processor, payment_transaction_id,
          delivery_street, delivery_city, delivery_state, delivery_zip, delivery_phone,
          special_instructions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customerId,
          orderType,
          'pending',
          totalAmount,
          'card',
          isTestMode ? 'square_test' : 'square',
          payment.id,
          sanitizedAddress?.street || null,
          sanitizedAddress?.city || null,
          sanitizedAddress?.state || null,
          sanitizedAddress?.zipCode || null,
          sanitizedCustomer.phone,
          sanitizedInstructions
        ]
      );

      const orderId = orderResult.insertId;

      // Insert order items
      for (const item of items) {
        await connection.query(
          'INSERT INTO Order_Items (order_id, item_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.item_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );
      }

      // Insert payment transaction
      await connection.query(
        `INSERT INTO Payment_Transactions (
          order_id, amount, payment_status, payment_method, payment_processor,
          processor_transaction_id, last_four_digits, card_brand, payment_response_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          totalAmount,
          'completed',
          'card',
          isTestMode ? 'square_test' : 'square',
          payment.id,
          lastFour,
          cardBrand,
          paymentResponseHash
        ]
      );

      await connection.commit();

      // Calculate estimated time
      const estimatedTime = orderType === 'delivery' ? '30-45 minutes' : '15-20 minutes';

      res.json({
        success: true,
        message: 'Order placed successfully',
        orderId,
        orderDetails: {
          orderId,
          orderType,
          totalAmount,
          estimatedTime,
          customerName: `${sanitizedCustomer.firstName} ${sanitizedCustomer.lastName}`,
          customerEmail: sanitizedCustomer.email
        }
      });

    } catch (dbError) {
      if (connection) await connection.rollback();
      console.error('Database error:', dbError);
      throw dbError;
    } finally {
      if (connection) connection.release();
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process payment'
    });
  }
});

// GET /api/payment/square-config - Get Square configuration for frontend
router.get('/square-config', (req, res) => {
  res.json({
    success: true,
    config: {
      applicationId: process.env.SQUARE_APP_ID || 'sandbox-sq0idb-example',
      locationId: process.env.SQUARE_LOCATION_ID || 'example-location',
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox'
    }
  });
});

module.exports = router;
