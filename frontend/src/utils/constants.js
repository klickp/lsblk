/**
 * Environment configuration
 */

export const ENV = {
  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',

  // Square Configuration  
  SQUARE_APP_ID: import.meta.env.VITE_SQUARE_APP_ID || '',
  SQUARE_LOCATION_ID: import.meta.env.VITE_SQUARE_LOCATION_ID || '',
  SQUARE_REDIRECT_URL: import.meta.env.VITE_SQUARE_REDIRECT_URL || 'http://localhost:5175/square/callback',

  // Security
  ENABLE_HTTPS: import.meta.env.VITE_ENABLE_HTTPS === 'true',
  CSRF_PROTECTION: import.meta.env.VITE_CSRF_PROTECTION !== 'false',
  
  // Rate Limiting
  RATE_LIMIT_REQUESTS: parseInt(import.meta.env.VITE_RATE_LIMIT_REQUESTS) || 100,
  RATE_LIMIT_WINDOW: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW) || 900000, // 15 minutes

  // Session
  SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 3600000, // 1 hour
};

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const ORDER_TYPES = {
  DELIVERY: 'delivery',
  PICKUP: 'pickup',
  DINE_IN: 'dine-in'
};

export default ENV;
