const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/analytics/business - Get comprehensive business analytics
router.get('/business', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      const analytics = {};
      
      // Total orders and revenue
      const [totals] = await connection.query(`
        SELECT 
          COUNT(*) as totalOrders,
          COALESCE(SUM(total_amount), 0) as totalRevenue,
          COALESCE(AVG(total_amount), 0) as averageOrderValue
        FROM Orders
        WHERE status != 'cancelled'
      `);
      Object.assign(analytics, totals[0]);

      // Today's stats
      const [today] = await connection.query(`
        SELECT 
          COUNT(*) as ordersToday,
          COALESCE(SUM(total_amount), 0) as revenueToday
        FROM Orders
        WHERE DATE(order_date) = CURDATE()
          AND status != 'cancelled'
      `);
      Object.assign(analytics, today[0]);

      // This week's stats
      const [thisWeek] = await connection.query(`
        SELECT 
          COUNT(*) as ordersThisWeek,
          COALESCE(SUM(total_amount), 0) as revenueThisWeek
        FROM Orders
        WHERE YEARWEEK(order_date, 1) = YEARWEEK(CURDATE(), 1)
          AND status != 'cancelled'
      `);
      Object.assign(analytics, thisWeek[0]);

      // This month's stats
      const [thisMonth] = await connection.query(`
        SELECT 
          COUNT(*) as ordersThisMonth,
          COALESCE(SUM(total_amount), 0) as revenueThisMonth
        FROM Orders
        WHERE YEAR(order_date) = YEAR(CURDATE())
          AND MONTH(order_date) = MONTH(CURDATE())
          AND status != 'cancelled'
      `);
      Object.assign(analytics, thisMonth[0]);

      // Top selling items
      const [topItems] = await connection.query(`
        SELECT 
          m.name,
          SUM(oi.quantity) as quantity,
          SUM(oi.subtotal) as revenue
        FROM Order_Items oi
        JOIN Menu_Items m ON oi.item_id = m.item_id
        JOIN Orders o ON oi.order_id = o.order_id
        WHERE o.status != 'cancelled'
        GROUP BY m.item_id, m.name
        ORDER BY quantity DESC
        LIMIT 5
      `);
      analytics.topItems = topItems;

      // Orders by day (last 7 days)
      const [ordersByDay] = await connection.query(`
        SELECT 
          DATE_FORMAT(order_date, '%b %d') as date,
          COUNT(*) as count
        FROM Orders
        WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          AND status != 'cancelled'
        GROUP BY DATE(order_date)
        ORDER BY DATE(order_date)
      `);
      analytics.ordersByDay = ordersByDay;

      // Revenue by day (last 7 days)
      const [revenueByDay] = await connection.query(`
        SELECT 
          DATE_FORMAT(order_date, '%b %d') as date,
          COALESCE(SUM(total_amount), 0) as amount
        FROM Orders
        WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          AND status != 'cancelled'
        GROUP BY DATE(order_date)
        ORDER BY DATE(order_date)
      `);
      analytics.revenueByDay = revenueByDay;

      // Orders by status
      const [ordersByStatus] = await connection.query(`
        SELECT status, COUNT(*) as count
        FROM Orders
        GROUP BY status
      `);
      analytics.ordersByStatus = {};
      ordersByStatus.forEach(row => {
        analytics.ordersByStatus[row.status] = row.count;
      });

      // Peak hours
      const [peakHours] = await connection.query(`
        SELECT 
          HOUR(order_date) as hour,
          COUNT(*) as orders
        FROM Orders
        WHERE order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          AND status != 'cancelled'
        GROUP BY HOUR(order_date)
        HAVING orders > 0
        ORDER BY hour
      `);
      analytics.peakHours = peakHours.map(row => ({
        hour: String(row.hour).padStart(2, '0'),
        orders: row.orders
      }));

      connection.release();

      res.json({
        success: true,
        data: analytics
      });

    } catch (dbError) {
      connection.release();
      throw dbError;
    }

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection required for analytics',
      error: error.message
    });
  }
});

// GET /api/analytics/export - Export analytics data as CSV
router.get('/export', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [orders] = await connection.query(`
      SELECT 
        o.order_id,
        o.order_date,
        o.order_type,
        o.status,
        o.total_amount,
        o.payment_method,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name,
        c.email as customer_email
      FROM Orders o
      LEFT JOIN Customers c ON o.customer_id = c.customer_id
      WHERE o.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY o.order_date DESC
    `);

    connection.release();

    // Convert to CSV
    const csv = [
      'Order ID,Date,Type,Status,Amount,Payment Method,Customer Name,Customer Email',
      ...orders.map(order => 
        `${order.order_id},${order.order_date},${order.order_type},${order.status},${order.total_amount},${order.payment_method},"${order.customer_name}",${order.customer_email}`
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders-export.csv');
    res.send(csv);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data'
    });
  }
});

module.exports = router;
