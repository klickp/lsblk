-- ============================================================================
-- Update Orders Table for Delivery/Pickup and Secure Payment Processing
-- ============================================================================

-- Add order_type column to distinguish between delivery and pickup
ALTER TABLE Orders 
ADD COLUMN order_type ENUM('delivery', 'pickup') DEFAULT 'delivery' AFTER status;

-- Add full delivery address fields (in case of guest checkout or temp address)
ALTER TABLE Orders 
ADD COLUMN delivery_street VARCHAR(255) AFTER delivery_address_id,
ADD COLUMN delivery_city VARCHAR(100) AFTER delivery_street,
ADD COLUMN delivery_state VARCHAR(50) AFTER delivery_city,
ADD COLUMN delivery_zip VARCHAR(20) AFTER delivery_state,
ADD COLUMN delivery_phone VARCHAR(20) AFTER delivery_zip;

-- Add payment processor fields
ALTER TABLE Orders
ADD COLUMN payment_processor VARCHAR(50) DEFAULT 'square' AFTER payment_method,
ADD COLUMN payment_transaction_id VARCHAR(255) AFTER payment_processor;

-- Update Payment_Transactions table for Square integration
ALTER TABLE Payment_Transactions
ADD COLUMN payment_processor VARCHAR(50) DEFAULT 'square' AFTER payment_method,
ADD COLUMN processor_transaction_id VARCHAR(255) AFTER payment_processor,
ADD COLUMN last_four_digits CHAR(4) AFTER processor_transaction_id,
ADD COLUMN card_brand VARCHAR(50) AFTER last_four_digits,
ADD COLUMN payment_response_hash TEXT AFTER card_brand;

-- Add index for transaction lookups
CREATE INDEX idx_payment_transactions_processor_id ON Payment_Transactions(processor_transaction_id);
CREATE INDEX idx_orders_payment_transaction_id ON Orders(payment_transaction_id);
