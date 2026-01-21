-- ============================================================================
-- TEST/DEVELOPMENT DATA - Database Reset Script
-- ============================================================================
-- Purpose: Reset database to clean state and optionally load test data
-- Usage: Run this script to clear all tables and start fresh
-- WARNING: This will DELETE ALL DATA in the database!
--
-- Usage:
--   mysql -h <host> -u <user> -p <password> <database> < test.session.sql
-- ============================================================================

-- Temporarily disable foreign key checks for clean drop
SET FOREIGN_KEY_CHECKS = 0;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS Order_Item_Customizations;
DROP TABLE IF EXISTS Payment_Transactions;
DROP TABLE IF EXISTS Order_Items;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS Customizations;
DROP TABLE IF EXISTS Menu_Items;
DROP TABLE IF EXISTS Menu_Categories;
DROP TABLE IF EXISTS Addresses;
DROP TABLE IF EXISTS Customers;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- RECREATE SCHEMA
-- ============================================================================

-- CUSTOMERS TABLE
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

-- ADDRESSES TABLE
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

-- MENU_CATEGORIES TABLE
CREATE TABLE Menu_Categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- MENU_ITEMS TABLE
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

-- CUSTOMIZATIONS TABLE
CREATE TABLE Customizations (
    customization_id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    price_modifier DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (item_id) REFERENCES Menu_Items(item_id) ON DELETE CASCADE
);

-- ORDERS TABLE
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

-- ORDER_ITEMS TABLE
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

-- ORDER_ITEM_CUSTOMIZATIONS TABLE
CREATE TABLE Order_Item_Customizations (
    order_item_id INT NOT NULL,
    customization_id INT NOT NULL,
    PRIMARY KEY (order_item_id, customization_id),
    FOREIGN KEY (order_item_id) REFERENCES Order_Items(order_item_id) ON DELETE CASCADE,
    FOREIGN KEY (customization_id) REFERENCES Customizations(customization_id) ON DELETE RESTRICT
);

-- PAYMENT_TRANSACTIONS TABLE
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
-- OPTIONAL: INSERT TEST DATA (uncomment to use)
-- ============================================================================

-- Insert test customer
-- INSERT INTO Customers (email, password_hash, first_name, last_name, phone_number)
-- VALUES 
-- ('john@example.com', '$2b$10$...', 'John', 'Doe', '555-0123'),
-- ('jane@example.com', '$2b$10$...', 'Jane', 'Smith', '555-0124');

-- Insert test menu categories
-- INSERT INTO Menu_Categories (name, display_order, is_active)
-- VALUES
-- ('Burgers', 1, TRUE),
-- ('Drinks', 2, TRUE),
-- ('Desserts', 3, TRUE);

-- Insert test menu items
-- INSERT INTO Menu_Items (category_id, name, description, price, is_available)
-- VALUES
-- (1, 'Classic Burger', 'Beef patty with lettuce and tomato', 9.99, TRUE),
-- (1, 'Double Burger', 'Two beef patties with cheese', 12.99, TRUE),
-- (2, 'Cola', 'Refreshing cola drink', 2.99, TRUE),
-- (3, 'Ice Cream', 'Vanilla ice cream', 4.99, TRUE);

-- ============================================================================
-- SCHEMA RESET COMPLETE
-- ============================================================================
-- All tables have been dropped and recreated
-- Database is now in a clean state ready for development
-- Uncomment the INSERT statements above to load sample data
-- ============================================================================
