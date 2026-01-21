-- Restaurant Order Management System Database Schema
-- Disable foreign key checks to make dropping easier
SET FOREIGN_KEY_CHECKS = 0;

-- Drop all existing tables if they exist
DROP TABLE IF EXISTS Order_Item_Customizations;
DROP TABLE IF EXISTS Order_Item_Selections;
DROP TABLE IF EXISTS Payment_Transactions;
DROP TABLE IF EXISTS Order_Items;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS Customizations;
DROP TABLE IF EXISTS Menu_Item_Options;
DROP TABLE IF EXISTS Menu_Items;
DROP TABLE IF EXISTS Menu_Categories;
DROP TABLE IF EXISTS Addresses;
DROP TABLE IF EXISTS Customers;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Customers Table
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

-- Addresses Table
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

-- Menu_Categories Table
CREATE TABLE Menu_Categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Menu_Items Table
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

-- Customizations Table
CREATE TABLE Customizations (
    customization_id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    price_modifier DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (item_id) REFERENCES Menu_Items(item_id) ON DELETE CASCADE
);

-- Orders Table
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

-- Order_Items Table
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

-- Order_Item_Customizations Junction Table
CREATE TABLE Order_Item_Customizations (
    order_item_id INT NOT NULL,
    customization_id INT NOT NULL,
    PRIMARY KEY (order_item_id, customization_id),
    FOREIGN KEY (order_item_id) REFERENCES Order_Items(order_item_id) ON DELETE CASCADE,
    FOREIGN KEY (customization_id) REFERENCES Customizations(customization_id) ON DELETE RESTRICT
);

-- Payment_Transactions Table
CREATE TABLE Payment_Transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE RESTRICT
);

-- Create indexes for better query performance
CREATE INDEX idx_customers_email ON Customers(email);
CREATE INDEX idx_addresses_customer_id ON Addresses(customer_id);
CREATE INDEX idx_menu_items_category_id ON Menu_Items(category_id);
CREATE INDEX idx_orders_customer_id ON Orders(customer_id);
CREATE INDEX idx_orders_status ON Orders(status);
CREATE INDEX idx_order_items_order_id ON Order_Items(order_id);
CREATE INDEX idx_order_items_item_id ON Order_Items(item_id);
CREATE INDEX idx_customizations_item_id ON Customizations(item_id);
CREATE INDEX idx_payment_transactions_order_id ON Payment_Transactions(order_id);