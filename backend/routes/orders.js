const express = require('express');
const pool = require('../db');

const router = express.Router();

// Mock orders storage (in-memory for now)
let mockOrders = [
  {
    order_id: 1001,
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    customer_phone: '555-0123',
    status: 'completed',
    subtotal: 21.98,
    tax_amount: 1.76,
    delivery_fee: 0,
    total_price: 23.74,
    notes: 'Extra napkins please',
    order_date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    created_at: new Date(Date.now() - 86400000).toISOString(),
    items: [
      { item_id: 1, item_name: 'Classic Burger', quantity: 2, price_at_order: 8.99 },
      { item_id: 16, item_name: 'Coke', quantity: 2, price_at_order: 2.99 }
    ]
  },
  {
    order_id: 1002,
    customer_name: 'Jane Smith',
    customer_email: 'jane@example.com',
    status: 'preparing',
    subtotal: 27.98,
    tax_amount: 2.24,
    delivery_fee: 2.99,
    total_price: 33.21,
    notes: '',
    order_date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    created_at: new Date(Date.now() - 3600000).toISOString(),
    items: [
      { item_id: 7, item_name: 'Pepperoni Pizza', quantity: 1, price_at_order: 13.99 },
      { item_id: 11, item_name: 'Spaghetti Carbonara', quantity: 1, price_at_order: 11.99 },
      { item_id: 16, item_name: 'Coke', quantity: 1, price_at_order: 2.99 }
    ]
  },
  {
    order_id: 1003,
    customer_name: 'Bob Johnson',
    customer_email: 'bob@example.com',
    status: 'ready',
    subtotal: 18.98,
    tax_amount: 1.52,
    delivery_fee: 2.99,
    total_price: 23.49,
    notes: 'No onions',
    order_date: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    created_at: new Date(Date.now() - 1800000).toISOString(),
    items: [
      { item_id: 3, item_name: 'Bacon Burger', quantity: 1, price_at_order: 10.99 },
      { item_id: 26, item_name: 'Caesar Salad', quantity: 1, price_at_order: 9.99 },
      { item_id: 19, item_name: 'Iced Tea', quantity: 1, price_at_order: 2.49 }
    ]
  }
];

let nextOrderId = 1004;

// Create a new order
router.post('/orders', async (req, res) => {
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

    try {
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
    } catch (dbError) {
      // Database not available, use mock data
      console.log('Database not available, using mock response');
      
      const orderId = nextOrderId++;
      
      const newOrder = {
        order_id: orderId,
        customer_name,
        customer_email: customer_email || null,
        customer_phone: customer_phone || null,
        status: 'pending',
        subtotal: calculatedSubtotal,
        tax_amount: calculatedTax,
        delivery_fee: calculatedDeliveryFee,
        total_price: calculatedTotal,
        notes: notes || '',
        delivery_address: delivery_address || '',
        order_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        items: items.map(item => ({
          item_id: item.item_id,
          item_name: item.name || 'Unknown Item',
          quantity: item.quantity,
          price_at_order: item.price
        }))
      };
      
      mockOrders.push(newOrder);
      
      res.json({ 
        success: true, 
        orderId,
        message: 'Order created successfully (mock)',
        order: {
          order_id: orderId,
          customer_name,
          status: 'pending',
          total_price: calculatedTotal
        }
      });
    }
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get all orders (with optional filtering)
router.get('/orders', async (req, res) => {
  try {
    const { status, customer_name, customer_email } = req.query;
    
    // Try database first
    try {
      const connection = await pool.getConnection();
      
      let query = `
        SELECT order_id, customer_name, customer_email, total_price, status, created_at, updated_at
        FROM Orders
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
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

      const [orders] = await connection.query(query, params);
      connection.release();

      if (orders.length > 0) {
        return res.json({ success: true, data: orders });
      }
    } catch (dbError) {
      console.log('Database not available, using mock data');
    }

    // Use mock data with filtering
    let filteredOrders = [...mockOrders];
    
    if (status) {
      filteredOrders = filteredOrders.filter(o => o.status === status);
    }
    
    if (customer_name) {
      filteredOrders = filteredOrders.filter(o => 
        o.customer_name.toLowerCase().includes(customer_name.toLowerCase())
      );
    }

    if (customer_email) {
      filteredOrders = filteredOrders.filter(o => 
        o.customer_email && o.customer_email.toLowerCase() === customer_email.toLowerCase()
      );
    }
    
    // Sort by created_at desc
    filteredOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({ success: true, data: filteredOrders });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order details
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderIdNum = parseInt(orderId);
    
    try {
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

      return res.json({ 
        success: true, 
        data: {
          ...order[0],
          items
        }
      });
    } catch (dbError) {
      console.log('Database not available, using mock data');
    }
    
    // Use mock data
    const order = mockOrders.find(o => o.order_id === orderIdNum);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ 
      success: true, 
      data: order
    });
  } catch (error) {
    console.error('Order detail fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orderIdNum = parseInt(orderId);

    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    try {
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

      return res.json({ success: true, message: 'Order status updated' });
    } catch (dbError) {
      console.log('Database not available, using mock data');
    }
    
    // Use mock data
    const order = mockOrders.find(o => o.order_id === orderIdNum);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    order.status = status;
    order.updated_at = new Date().toISOString();
    
    res.json({ success: true, message: 'Order status updated', data: order });
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
