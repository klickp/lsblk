-- ============================================================================
-- Restaurant Order Management System - Database Schema
-- ============================================================================
-- Purpose: Complete database schema for a full-stack ordering system
-- Database: TiDB (MySQL-compatible)
-- Version: 1.0.0
-- 
-- Tables:
--   1. Customers - User accounts and authentication
--   2. Addresses - Customer delivery and billing addresses
--   3. Menu_Categories - Food categories (Burgers, Drinks, Desserts, etc.)
--   4. Menu_Items - Individual menu items with pricing
--   5. Customizations - Item customizations (toppings, sizes, etc.)
--   6. Orders - Customer orders with status tracking
--   7. Order_Items - Line items in each order
--   8. Order_Item_Customizations - Customizations selected for each item
--   9. Payment_Transactions - Payment records
-- ============================================================================

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================
-- Stores user account information and authentication credentials
-- Email is unique to support login by email
-- Password stored as hash (bcrypt recommended)
CREATE TABLE Customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================================
-- ADDRESSES TABLE
-- ============================================================================
-- Stores delivery and billing addresses for customers
-- Multiple addresses per customer supported
-- is_default flag indicates primary delivery address
CREATE TABLE Addresses (
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50),
    zip_code VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE
);

-- ============================================================================
-- MENU_CATEGORIES TABLE
-- ============================================================================
-- Categories for organizing menu items
-- display_order controls sorting in frontend UI
CREATE TABLE Menu_Categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- MENU_ITEMS TABLE
-- ============================================================================
-- Individual items available for order
-- Price stored as DECIMAL for financial accuracy
-- image_url can store path or URL to item image
-- is_available allows dynamic availability without deleting items
CREATE TABLE Menu_Items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES Menu_Categories(category_id) ON DELETE RESTRICT
);

-- ============================================================================
-- CUSTOMIZATIONS TABLE
-- ============================================================================
-- Optional customizations/modifiers for menu items
-- Examples: Extra cheese (+$0.50), Large size (+$1.00)
-- price_modifier can be positive (addition) or negative (discount)
CREATE TABLE Customizations (
    customization_id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    price_modifier DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (item_id) REFERENCES Menu_Items(item_id) ON DELETE CASCADE
);

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
-- Main orders table tracking customer purchases
-- Status values: pending, preparing, ready, completed, cancelled
-- delivery_address_id is nullable in case of other fulfillment methods
CREATE TABLE Orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    delivery_address_id INT,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE RESTRICT,
    FOREIGN KEY (delivery_address_id) REFERENCES Addresses(address_id) ON DELETE SET NULL
);

-- ============================================================================
-- ORDER_ITEMS TABLE
-- ============================================================================
-- Line items for each order
-- unit_price stored to preserve historical pricing if item price changes
-- subtotal = quantity * unit_price (can be calculated but stored for performance)
-- special_requests stores customer notes for this specific item
CREATE TABLE Order_Items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    special_requests TEXT,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES Menu_Items(item_id) ON DELETE RESTRICT
);

-- ============================================================================
-- ORDER_ITEM_CUSTOMIZATIONS JUNCTION TABLE
-- ============================================================================
-- Links order items to their selected customizations
-- Many-to-many relationship: one item can have multiple customizations
-- Composite primary key ensures no duplicate selections
CREATE TABLE Order_Item_Customizations (
    order_item_id INT NOT NULL,
    customization_id INT NOT NULL,
    PRIMARY KEY (order_item_id, customization_id),
    FOREIGN KEY (order_item_id) REFERENCES Order_Items(order_item_id) ON DELETE CASCADE,
    FOREIGN KEY (customization_id) REFERENCES Customizations(customization_id) ON DELETE RESTRICT
);

-- ============================================================================
-- PAYMENT_TRANSACTIONS TABLE
-- ============================================================================
-- Tracks all payment attempts and outcomes
-- Status values: pending, completed, failed, refunded
-- Allows tracking of payment history and disputes
CREATE TABLE Payment_Transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE RESTRICT
);

-- ============================================================================
-- INDEXES FOR QUERY PERFORMANCE
-- ============================================================================
-- Indexes on frequently searched/joined columns

-- Customer lookups by email (authentication)
CREATE INDEX idx_customers_email ON Customers(email);

-- Address lookups by customer
CREATE INDEX idx_addresses_customer_id ON Addresses(customer_id);

-- Menu item lookups by category
CREATE INDEX idx_menu_items_category_id ON Menu_Items(category_id);

-- Order lookups by customer
CREATE INDEX idx_orders_customer_id ON Orders(customer_id);

-- Order status filtering (common query for dashboard)
CREATE INDEX idx_orders_status ON Orders(status);

-- Order item lookups by order
CREATE INDEX idx_order_items_order_id ON Order_Items(order_id);

-- Order item lookups by item (for item popularity reports)
CREATE INDEX idx_order_items_item_id ON Order_Items(item_id);

-- Customization lookups by item
CREATE INDEX idx_customizations_item_id ON Customizations(item_id);

-- Payment transaction lookups by order
CREATE INDEX idx_payment_transactions_order_id ON Payment_Transactions(order_id);

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- To initialize this schema on TiDB:
--
-- Option 1: Using command line
--   mysql -h <host> -u <user> -p <password> <database> < schema.sql
--
-- Option 2: Using GUI client (MySQL Workbench, DBeaver, etc.)
--   1. Open connection to TiDB
--   2. Create database: CREATE DATABASE ordering_system;
--   3. Select database: USE ordering_system;
--   4. Paste and execute this entire file
--
-- After setup, use test.session.sql to reset/seed data
-- ============================================================================
