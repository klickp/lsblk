const express = require('express');
const pool = require('../db');
const { menuValidation } = require('../middleware/validator');

const router = express.Router();

// Get all menu items with categories
router.get('/menu', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [items] = await connection.query(`
      SELECT 
        mi.item_id,
        mi.name,
        mi.description,
        mi.price,
        mi.image_url,
        mc.name as category,
        mi.is_available
      FROM Menu_Items mi
      JOIN Menu_Categories mc ON mi.category_id = mc.category_id
      WHERE mi.is_available = TRUE
      ORDER BY mc.display_order, mi.name
    `);
    connection.release();
    
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Menu fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch menu items from database' });
  }
});

// Get menu categories
router.get('/categories', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [categories] = await connection.query(`
      SELECT category_id, name, display_order
      FROM Menu_Categories
      ORDER BY display_order
    `);
    connection.release();
    
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch categories from database' });
  }
});

// Get items by category
router.get('/categories/:categoryId/items', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const connection = await pool.getConnection();
    const [items] = await connection.query(`
      SELECT 
        item_id,
        name,
        description,
        price,
        image_url,
        is_available
      FROM Menu_Items
      WHERE category_id = ? AND is_available = TRUE
      ORDER BY name
    `, [categoryId]);
    connection.release();
    
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Category items fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

module.exports = router;
