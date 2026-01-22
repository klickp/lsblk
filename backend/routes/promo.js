const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const xss = require('xss');
const db = require('../db');

// Fallback promo codes if database is unavailable
const FALLBACK_CODES = {
  '12345678': { description: 'Special discount code', type: 'percentage', discount_percent: 20, discount_amount: 0, min_order_amount: 10, max_discount: 50 },
  'PIZZA2FOR1': { description: 'Buy 2 Large Pizzas, Get 1 Medium Free', type: 'buy2get1', discount_percent: 0, discount_amount: 12.99, min_order_amount: 30, max_discount: 12.99 },
  'SAVE20': { description: '20% off your order', type: 'percentage', discount_percent: 20, discount_amount: 0, min_order_amount: 25, max_discount: 50 },
  'FIRSTORDER': { description: '$5 off your first order', type: 'fixed', discount_percent: 0, discount_amount: 5, min_order_amount: 15, max_discount: 5 },
  'FREESHIP': { description: 'Free delivery', type: 'delivery', discount_percent: 0, discount_amount: 3.99, min_order_amount: 0, max_discount: 3.99 }
};

// Validate promo code - server-side only with database lookup
// POST /api/promo/validate
router.post('/validate',
  [
    body('code').trim().isString().isLength({ min: 1, max: 50 })
      .customSanitizer(value => xss(value)),
    body('orderTotal').isFloat({ min: 0 }).withMessage('Invalid order total')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid promo code format' 
      });
    }

    let connection;
    try {
      const { code, orderTotal } = req.body;
      const upperCode = code.toUpperCase().trim();
      let promo = null;

      // Try database first
      try {
        connection = await db.getConnection();
        const [promos] = await connection.query(
          `SELECT * FROM Promo_Codes 
           WHERE code = ? AND is_active = TRUE 
           AND (valid_until IS NULL OR valid_until > NOW())
           AND (usage_limit IS NULL OR times_used < usage_limit)`,
          [upperCode]
        );

        if (promos.length > 0) {
          promo = promos[0];
        }
      } catch (dbError) {
        console.log('Database unavailable, using fallback codes');
        // Use fallback if database fails
        if (FALLBACK_CODES[upperCode]) {
          promo = {
            code: upperCode,
            description: FALLBACK_CODES[upperCode].description,
            type: FALLBACK_CODES[upperCode].type,
            discount_percent: FALLBACK_CODES[upperCode].discount_percent,
            discount_amount: FALLBACK_CODES[upperCode].discount_amount,
            min_order_amount: FALLBACK_CODES[upperCode].min_order_amount,
            max_discount: FALLBACK_CODES[upperCode].max_discount,
            is_active: true
          };
        }
      }

      if (!promo) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid or expired promo code' 
        });
      }

      // Check minimum order amount
      if (orderTotal < promo.min_order_amount) {
        return res.status(400).json({ 
          success: false,
          error: `Minimum order of $${promo.min_order_amount.toFixed(2)} required for this promo` 
        });
      }

      // Calculate discount based on type
      let discountAmount = 0;
      
      if (promo.type === 'percentage') {
        discountAmount = (orderTotal * promo.discount_percent) / 100;
        if (promo.max_discount) {
          discountAmount = Math.min(discountAmount, promo.max_discount);
        }
      } else if (promo.type === 'fixed' || promo.type === 'delivery' || promo.type === 'buy2get1') {
        discountAmount = promo.discount_amount;
      }

      // Ensure discount doesn't exceed order total
      discountAmount = Math.min(discountAmount, orderTotal);

      // Increment usage counter if using database
      if (connection && promo.promo_id) {
        try {
          await connection.query(
            'UPDATE Promo_Codes SET times_used = times_used + 1 WHERE promo_id = ?',
            [promo.promo_id]
          );
        } catch (err) {
          console.log('Could not update promo usage count');
        }
      }

      return res.json({
        success: true,
        data: {
          code: upperCode,
          description: promo.description,
          discountAmount: Number(discountAmount.toFixed(2)),
          type: promo.type
        }
      });

    } catch (error) {
      console.error('Promo validation error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to validate promo code' 
      });
    } finally {
      if (connection) connection.release();
    }
  }
);

module.exports = router;
