const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: errors.array()[0].msg,
      errors: errors.array() 
    });
  }
  next();
};

// Sanitize string input to prevent XSS
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  // Remove any HTML tags and encode special characters
  return xss(value, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style']
  });
};

// Custom sanitizer middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }
  
  // Sanitize query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }
  
  next();
};

// Validation rules for authentication
const authValidation = {
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please enter a valid email address')
      .normalizeEmail()
      .isLength({ max: 255 }).withMessage('Email is too long'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one number')
      .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
    validate
  ],
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please enter a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required'),
    validate
  ]
};

// Validation rules for orders
const orderValidation = {
  create: [
    body('customer_name')
      .trim()
      .notEmpty().withMessage('Customer name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters'),
    body('customer_email')
      .optional({ checkFalsy: true })
      .trim()
      .isEmail().withMessage('Please enter a valid email address')
      .normalizeEmail(),
    body('customer_phone')
      .optional({ checkFalsy: true })
      .trim()
      .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Phone number contains invalid characters')
      .isLength({ max: 20 }).withMessage('Phone number is too long'),
    body('items')
      .isArray({ min: 1 }).withMessage('Order must contain at least one item'),
    body('items.*.item_id')
      .isInt({ min: 1 }).withMessage('Invalid item ID'),
    body('items.*.quantity')
      .isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99'),
    body('items.*.price')
      .isFloat({ min: 0 }).withMessage('Invalid price'),
    body('subtotal')
      .optional()
      .isFloat({ min: 0 }).withMessage('Invalid subtotal'),
    body('tax_amount')
      .optional()
      .isFloat({ min: 0 }).withMessage('Invalid tax amount'),
    body('delivery_fee')
      .optional()
      .isFloat({ min: 0 }).withMessage('Invalid delivery fee'),
    body('total_price')
      .optional()
      .isFloat({ min: 0 }).withMessage('Invalid total price'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Notes are too long'),
    body('delivery_address')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Address is too long'),
    validate
  ],
  updateStatus: [
    param('orderId')
      .isInt({ min: 1 }).withMessage('Invalid order ID'),
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['pending', 'preparing', 'ready', 'completed', 'cancelled'])
      .withMessage('Invalid order status'),
    validate
  ],
  getById: [
    param('orderId')
      .isInt({ min: 1 }).withMessage('Invalid order ID'),
    validate
  ],
  list: [
    query('status')
      .optional()
      .trim()
      .matches(/^(pending|preparing|ready|completed|cancelled)(,(pending|preparing|ready|completed|cancelled))*$/)
      .withMessage('Invalid status filter'),
    query('customer_name')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Customer name is too long'),
    query('customer_email')
      .optional()
      .trim()
      .isEmail().withMessage('Invalid email format'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validate
  ]
};

// Validation for menu routes
const menuValidation = {
  getByCategory: [
    param('categoryId')
      .isInt({ min: 1 }).withMessage('Invalid category ID'),
    validate
  ]
};

module.exports = {
  validate,
  sanitizeInput,
  authValidation,
  orderValidation,
  menuValidation
};
