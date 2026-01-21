const express = require('express');
const pool = require('../db');

const router = express.Router();

// Mock data for testing
const mockCategories = [
  { category_id: 1, name: 'Burgers', display_order: 1 },
  { category_id: 2, name: 'Pizzas', display_order: 2 },
  { category_id: 3, name: 'Pasta', display_order: 3 },
  { category_id: 4, name: 'Drinks', display_order: 4 },
  { category_id: 5, name: 'Desserts', display_order: 5 },
  { category_id: 6, name: 'Salads', display_order: 6 },
];

const mockMenuItems = [
  // Burgers
  { item_id: 1, name: 'Classic Burger', description: 'Juicy beef burger with lettuce and tomato', price: 8.99, category: 'Burgers', category_id: 1, is_available: true, image_url: null },
  { item_id: 2, name: 'Cheese Burger', description: 'Beef burger with melted cheddar cheese', price: 9.99, category: 'Burgers', category_id: 1, is_available: true, image_url: null },
  { item_id: 3, name: 'Bacon Burger', description: 'Beef with crispy bacon and BBQ sauce', price: 10.99, category: 'Burgers', category_id: 1, is_available: true, image_url: null },
  { item_id: 4, name: 'Double Burger', description: 'Two patties with all the toppings', price: 12.99, category: 'Burgers', category_id: 1, is_available: true, image_url: null },
  { item_id: 5, name: 'Mushroom Swiss Burger', description: 'Beef with mushrooms and swiss cheese', price: 11.49, category: 'Burgers', category_id: 1, is_available: true, image_url: null },
  
  // Pizzas
  { item_id: 6, name: 'Margherita Pizza', description: 'Fresh mozzarella, tomato, and basil', price: 12.99, category: 'Pizzas', category_id: 2, is_available: true, image_url: null },
  { item_id: 7, name: 'Pepperoni Pizza', description: 'Classic pepperoni with extra cheese', price: 13.99, category: 'Pizzas', category_id: 2, is_available: true, image_url: null },
  { item_id: 8, name: 'Vegetarian Pizza', description: 'Bell peppers, onions, mushrooms, olives', price: 12.49, category: 'Pizzas', category_id: 2, is_available: true, image_url: null },
  { item_id: 9, name: 'Meat Lovers Pizza', description: 'Pepperoni, sausage, ham, and bacon', price: 15.99, category: 'Pizzas', category_id: 2, is_available: true, image_url: null },
  { item_id: 10, name: 'BBQ Chicken Pizza', description: 'Grilled chicken, BBQ sauce, red onion', price: 14.49, category: 'Pizzas', category_id: 2, is_available: true, image_url: null },
  
  // Pasta
  { item_id: 11, name: 'Spaghetti Carbonara', description: 'Classic Italian pasta with bacon and cream', price: 11.99, category: 'Pasta', category_id: 3, is_available: true, image_url: null },
  { item_id: 12, name: 'Fettuccine Alfredo', description: 'Creamy parmesan sauce over fettuccine', price: 10.99, category: 'Pasta', category_id: 3, is_available: true, image_url: null },
  { item_id: 13, name: 'Penne Arrabbiata', description: 'Spicy tomato sauce with garlic', price: 9.99, category: 'Pasta', category_id: 3, is_available: true, image_url: null },
  { item_id: 14, name: 'Lasagna', description: 'Layers of pasta, meat, and ricotta cheese', price: 12.99, category: 'Pasta', category_id: 3, is_available: true, image_url: null },
  { item_id: 15, name: 'Ravioli Ricotta', description: 'Cheese-filled ravioli with marinara sauce', price: 11.49, category: 'Pasta', category_id: 3, is_available: true, image_url: null },
  
  // Drinks
  { item_id: 16, name: 'Coke', description: 'Ice cold Coca-Cola', price: 2.99, category: 'Drinks', category_id: 4, is_available: true, image_url: null },
  { item_id: 17, name: 'Sprite', description: 'Refreshing lemon-lime soda', price: 2.99, category: 'Drinks', category_id: 4, is_available: true, image_url: null },
  { item_id: 18, name: 'Lemonade', description: 'Fresh homemade lemonade', price: 3.49, category: 'Drinks', category_id: 4, is_available: true, image_url: null },
  { item_id: 19, name: 'Iced Tea', description: 'Cold brewed iced tea', price: 2.49, category: 'Drinks', category_id: 4, is_available: true, image_url: null },
  { item_id: 20, name: 'Orange Juice', description: 'Fresh squeezed orange juice', price: 3.99, category: 'Drinks', category_id: 4, is_available: true, image_url: null },
  
  // Desserts
  { item_id: 21, name: 'Chocolate Cake', description: 'Rich chocolate cake with frosting', price: 5.99, category: 'Desserts', category_id: 5, is_available: true, image_url: null },
  { item_id: 22, name: 'Vanilla Ice Cream', description: 'Vanilla ice cream sundae with toppings', price: 4.99, category: 'Desserts', category_id: 5, is_available: true, image_url: null },
  { item_id: 23, name: 'Cheesecake', description: 'New York style cheesecake', price: 6.99, category: 'Desserts', category_id: 5, is_available: true, image_url: null },
  { item_id: 24, name: 'Brownie', description: 'Fudgy chocolate brownie', price: 3.99, category: 'Desserts', category_id: 5, is_available: true, image_url: null },
  { item_id: 25, name: 'Tiramisu', description: 'Classic Italian tiramisu', price: 5.49, category: 'Desserts', category_id: 5, is_available: true, image_url: null },
  
  // Salads
  { item_id: 26, name: 'Caesar Salad', description: 'Romaine, parmesan, croutons, caesar dressing', price: 9.99, category: 'Salads', category_id: 6, is_available: true, image_url: null },
  { item_id: 27, name: 'Garden Salad', description: 'Mixed greens, tomatoes, cucumbers, carrots', price: 8.99, category: 'Salads', category_id: 6, is_available: true, image_url: null },
  { item_id: 28, name: 'Greek Salad', description: 'Feta cheese, olives, tomatoes, onions', price: 10.49, category: 'Salads', category_id: 6, is_available: true, image_url: null },
  { item_id: 29, name: 'Caprese Salad', description: 'Mozzarella, tomatoes, basil, balsamic', price: 10.99, category: 'Salads', category_id: 6, is_available: true, image_url: null },
];

// Get all menu items with categories
router.get('/menu', async (req, res) => {
  try {
    // Try to get from database first
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
      
      if (items.length > 0) {
        return res.json({ success: true, data: items });
      }
    } catch (dbError) {
      console.log('Database not available, using mock data:', dbError.message);
    }

    // Fallback to mock data
    res.json({ success: true, data: mockMenuItems });
  } catch (error) {
    console.error('Menu fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// Get menu categories
router.get('/categories', async (req, res) => {
  try {
    // Try database first
    try {
      const connection = await pool.getConnection();
      const [categories] = await connection.query(`
        SELECT category_id, name, display_order
        FROM Menu_Categories
        WHERE is_active = TRUE
        ORDER BY display_order
      `);
      connection.release();
      
      if (categories.length > 0) {
        return res.json({ success: true, data: categories });
      }
    } catch (dbError) {
      console.log('Database not available, using mock data');
    }

    // Fallback to mock data
    res.json({ success: true, data: mockCategories });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get menu items by category
router.get('/menu/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Try database first
    try {
      const connection = await pool.getConnection();
      const [items] = await connection.query(`
        SELECT item_id, name, description, price, image_url, is_available
        FROM Menu_Items
        WHERE category_id = ? AND is_available = TRUE
        ORDER BY name
      `, [categoryId]);
      connection.release();
      
      if (items.length > 0) {
        return res.json({ success: true, data: items });
      }
    } catch (dbError) {
      console.log('Database not available, using mock data');
    }

    // Fallback to mock data
    const filtered = mockMenuItems.filter(item => item.category_id === parseInt(categoryId));
    res.json({ success: true, data: filtered });
  } catch (error) {
    console.error('Category items fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

module.exports = router;

