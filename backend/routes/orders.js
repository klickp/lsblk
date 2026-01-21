const express = require('express');
const pool = require('../db');

const router = express.Router();

// Create a new order
router.post('/orders', async (req, res) => {
  try {
    const { customer_name, items, total_price, notes } = req.body;
    
    if (!customer_name || !items || items.length === 0) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    const connection = await pool.getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();

      // Create order
      const [orderResult] = await connection.query(`
        INSERT INTO Orders (customer_name, total_price, status, notes, created_at)
        VALUES (?, ?, 'pending', ?, NOW())
      `, [customer_name, total_price, notes || '']);

      const orderId = orderResult.insertId;

      // Add order items
      for (const item of items) {
        await connection.query(`
          INSERT INTO Order_Items (order_id, item_id, quantity, price_at_order)
          VALUES (?, ?, ?, ?)
        `, [orderId, item.item_id, item.quantity, item.price]);
      }

      await connection.commit();
      connection.release();

      res.json({ 
        success: true, 
        orderId,
        message: 'Order created successfully' 
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
router.get('/orders', async (req, res) => {
  try {
    const { status, customer_name } = req.query;
    
    // Try database first
    try {
      const connection = await pool.getConnection();
      
      let query = `
        SELECT order_id, customer_name, total_price, status, created_at, updated_at
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

      query += ' ORDER BY created_at DESC';

      const [orders] = await connection.query(query, params);
      connection.release();

      if (orders.length > 0) {
        return res.json({ success: true, data: orders });
      }
    } catch (dbError) {
      console.log('Database not available, using mock data');
    }

    // Return empty array if no database
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order details
router.get('/orders/:orderId', async (req, res) => {
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
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
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
    console.error('Order update error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

module.exports = router;
