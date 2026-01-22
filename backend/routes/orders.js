const express = require('express');
const pool = require('../db');
const { orderValidation, sanitizeInput } = require('../middleware/validator');

const router = express.Router();

// Create a new order
router.post('/orders', sanitizeInput, orderValidation.create, async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, items, subtotal, tax_amount, delivery_fee, total_price, notes, delivery_address } = req.body;
    
    if (!customer_name || !items || items.length === 0) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Calculate financials if not provided
    const calculatedSubtotal = subtotal || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const calculatedTax = tax_amount || (calculatedSubtotal * 0.08); // 8% tax
    const calculatedDeliveryFee = delivery_fee || 0;
    const calculatedTotal = total_price || (calculatedSubtotal + calculatedTax + calculatedDeliveryFee);

    const connection = await pool.getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();

      // Create order with full financial tracking
      const [orderResult] = await connection.query(`
        INSERT INTO Orders (
          customer_name, customer_email, customer_phone,
          status, subtotal, tax_amount, delivery_fee, total_price,
          notes, delivery_address, payment_method, payment_status,
          created_at
        )
        VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, 'cash', 'completed', NOW())
      `, [
        customer_name, 
        customer_email || null,
        customer_phone || null,
        calculatedSubtotal,
        calculatedTax,
        calculatedDeliveryFee,
        calculatedTotal,
        notes || '',
        delivery_address || ''
      ]);

      const orderId = orderResult.insertId;

      // Add order items with item name for historical reference
      for (const item of items) {
        const itemSubtotal = item.price * item.quantity;
        await connection.query(`
          INSERT INTO Order_Items (
            order_id, item_id, item_name, quantity, 
            price_at_order, subtotal
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          orderId, 
          item.item_id, 
          item.name || 'Unknown Item',
          item.quantity, 
          item.price,
          itemSubtotal
        ]);
      }

      await connection.commit();
      connection.release();

      res.json({ 
        success: true, 
        orderId,
        message: 'Order created successfully',
        order: {
          order_id: orderId,
          customer_name,
          status: 'pending',
          total_price: calculatedTotal
        }
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get all orders (with optional filtering)
router.get('/orders', orderValidation.list, async (req, res) => {
  try {
    const { status, customer_name, customer_email, limit } = req.query;
    const orderLimit = limit ? Math.min(parseInt(limit), 100) : null; // Max 100 to prevent abuse
    
    const connection = await pool.getConnection();
    
    let query = `
      SELECT order_id, customer_name, customer_email, total_price, status, created_at, updated_at
      FROM Orders
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      // Support comma-separated statuses
      const statuses = status.split(',').map(s => s.trim());
      const placeholders = statuses.map(() => '?').join(',');
      query += ` AND status IN (${placeholders})`;
      params.push(...statuses);
    }
    
    if (customer_name) {
      query += ' AND customer_name LIKE ?';
      params.push(`%${customer_name}%`);
    }

    if (customer_email) {
      query += ' AND customer_email = ?';
      params.push(customer_email);
    }

    query += ' ORDER BY created_at DESC';
    
    if (orderLimit) {
      query += ` LIMIT ${orderLimit}`;
    }

    const [orders] = await connection.query(query, params);
    connection.release();

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders from database' });
  }
});

// Get order details
router.get('/orders/:orderId', orderValidation.getById, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const connection = await pool.getConnection();

    const [order] = await connection.query(`
      SELECT order_id, customer_name, total_price, status, notes, created_at, updated_at
      FROM Orders
      WHERE order_id = ?
    `, [orderId]);

    if (order.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Order not found' });
    }

    const [items] = await connection.query(`
      SELECT oi.item_id, oi.quantity, oi.price_at_order, mi.name, mi.description
      FROM Order_Items oi
      JOIN Menu_Items mi ON oi.item_id = mi.item_id
      WHERE oi.order_id = ?
    `, [orderId]);

    connection.release();

    res.json({ 
      success: true, 
      data: {
        ...order[0],
        items
      }
    });
  } catch (error) {
    console.error('Order detail fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch order from database' });
  }
});

// Update order status
router.put('/orders/:orderId/status', sanitizeInput, orderValidation.updateStatus, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.query(`
      UPDATE Orders
      SET status = ?, updated_at = NOW()
      WHERE order_id = ?
    `, [status, orderId]);

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
