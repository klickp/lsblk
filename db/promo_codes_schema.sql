-- ============================================================================
-- PROMO CODES TABLE
-- ============================================================================
-- Stores promotional discount codes for customer orders
-- All validation logic happens server-side to prevent exploitation
CREATE TABLE IF NOT EXISTS Promo_Codes (
    promo_id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL,
    type ENUM('percentage', 'fixed', 'delivery', 'buy2get1') NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NULL,
    usage_limit INT DEFAULT NULL,
    times_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert initial promo code
INSERT INTO Promo_Codes (code, description, type, discount_percent, discount_amount, min_order_amount, max_discount, is_active) 
VALUES ('12345678', 'Special discount code', 'percentage', 20.00, 0.00, 10.00, 50.00, TRUE)
ON DUPLICATE KEY UPDATE description = 'Special discount code';

-- Insert additional promo codes for reference
INSERT INTO Promo_Codes (code, description, type, discount_percent, discount_amount, min_order_amount, max_discount, is_active) 
VALUES 
    ('PIZZA2FOR1', 'Buy 2 Large Pizzas, Get 1 Medium Free', 'buy2get1', 0.00, 12.99, 30.00, 12.99, TRUE),
    ('SAVE20', '20% off your order', 'percentage', 20.00, 0.00, 25.00, 50.00, TRUE),
    ('FIRSTORDER', '$5 off your first order', 'fixed', 0.00, 5.00, 15.00, 5.00, TRUE),
    ('FREESHIP', 'Free delivery', 'delivery', 0.00, 3.99, 0.00, 3.99, TRUE)
ON DUPLICATE KEY UPDATE description = VALUES(description);
