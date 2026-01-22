const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// Mock users storage for when database is unavailable
let mockUsers = [
  {
    user_id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    password_hash: '$2b$10$abcdefghijklmnopqrstuv', // mock hash
    created_at: new Date().toISOString()
  }
];
let nextUserId = 2;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password validation function
const validatePassword = (password) => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&*...)';
  }
  return null;
};

// Email validation function
const validateEmail = (email) => {
  if (!EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ error: emailError });
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      const connection = await pool.getConnection();

      // Check if user exists
      const [existing] = await connection.query(
        'SELECT user_id FROM Users WHERE email = ?',
        [email]
      );

      if (existing.length > 0) {
        connection.release();
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Create user
      const [result] = await connection.query(`
        INSERT INTO Users (name, email, password_hash, created_at)
        VALUES (?, ?, ?, NOW())
      `, [name, email, passwordHash]);

      connection.release();

      const userId = result.insertId;

      // Generate token
      const token = jwt.sign({ userId, email, name }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        success: true,
        message: 'Registration successful',
        user: { user_id: userId, name, email },
        token
      });
    } catch (dbError) {
      console.log('Database not available, using mock storage');

      // Check if email exists in mock
      const existing = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Add to mock users
      const newUser = {
        user_id: nextUserId++,
        name,
        email,
        password_hash: passwordHash,
        created_at: new Date().toISOString()
      };
      mockUsers.push(newUser);

      // Generate token
      const token = jwt.sign(
        { userId: newUser.user_id, email: newUser.email, name: newUser.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Registration successful (mock)',
        user: { user_id: newUser.user_id, name: newUser.name, email: newUser.email },
        token
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ error: emailError });
    }

    try {
      const connection = await pool.getConnection();

      const [users] = await connection.query(
        'SELECT user_id, name, email, password_hash FROM Users WHERE email = ?',
        [email]
      );

      connection.release();

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = users[0];

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.user_id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        user: { user_id: user.user_id, name: user.name, email: user.email },
        token
      });
    } catch (dbError) {
      console.log('Database not available, using mock storage');

      const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.user_id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful (mock)',
        user: { user_id: user.user_id, name: user.name, email: user.email },
        token
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Verify token (optional endpoint for checking if token is valid)
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      success: true,
      user: { user_id: decoded.userId, name: decoded.name, email: decoded.email }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
