-- ============================================================================
-- Simplified Order Management System - For Mock Data & Development
-- ============================================================================
-- This schema works without authentication and supports guest checkout
-- ============================================================================

-- ============================================================================
-- ORDERS TABLE (Simplified)
-- ============================================================================
-- Tracks all orders with guest support (no customer_id required)
-- Status flow: pending -> preparing -> ready -> completed
-- Includes financial tracking fields
CREATE TABLE IF NOT EXISTS Orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- Order Status & Tracking
    status ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    -- Financial Information
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    total_price DECIMAL(10, 2) NOT NULL,
    
    -- Order Details
    notes TEXT,
    delivery_address TEXT,
    
    -- Payment (optional for now)
    payment_method VARCHAR(50) DEFAULT 'cash',
    payment_status ENUM('pending', 'completed', 'refunded') DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_order_date (order_date),
    INDEX idx_customer_name (customer_name)
);

-- ============================================================================
-- ORDER_ITEMS TABLE
-- ============================================================================
-- Line items for each order
-- price_at_order preserves historical pricing
CREATE TABLE IF NOT EXISTS Order_Items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price_at_order DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    special_instructions TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id)
);

-- ============================================================================
-- MENU_CATEGORIES TABLE (For reference)
-- ============================================================================
CREATE TABLE IF NOT EXISTS Menu_Categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- MENU_ITEMS TABLE (For reference)
-- ============================================================================
CREATE TABLE IF NOT EXISTS Menu_Items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES Menu_Categories(category_id)
);
