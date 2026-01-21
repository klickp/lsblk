-- Script to Display All Tables and Their Contents

-- Show all tables in the database
SHOW TABLES;

-- Display structure and contents of each table

-- Customers Table
SELECT '=== CUSTOMERS TABLE ===' AS info;
DESCRIBE Customers;
SELECT * FROM Customers;

-- Addresses Table
SELECT '=== ADDRESSES TABLE ===' AS info;
DESCRIBE Addresses;
SELECT * FROM Addresses;

-- Menu_Categories Table
SELECT '=== MENU_CATEGORIES TABLE ===' AS info;
DESCRIBE Menu_Categories;
SELECT * FROM Menu_Categories;

-- Menu_Items Table
SELECT '=== MENU_ITEMS TABLE ===' AS info;
DESCRIBE Menu_Items;
SELECT * FROM Menu_Items;

-- Orders Table
SELECT '=== ORDERS TABLE ===' AS info;
DESCRIBE Orders;
SELECT * FROM Orders;

-- Order_Items Table
SELECT '=== ORDER_ITEMS TABLE ===' AS info;
DESCRIBE Order_Items;
SELECT * FROM Order_Items;

-- Customizations Table
SELECT '=== CUSTOMIZATIONS TABLE ===' AS info;
DESCRIBE Customizations;
SELECT * FROM Customizations;

-- Order_Item_Customizations Table
SELECT '=== ORDER_ITEM_CUSTOMIZATIONS TABLE ===' AS info;
DESCRIBE Order_Item_Customizations;
SELECT * FROM Order_Item_Customizations;

-- Payment_Transactions Table
SELECT '=== PAYMENT_TRANSACTIONS TABLE ===' AS info;
DESCRIBE Payment_Transactions;
SELECT * FROM Payment_Transactions;

-- Display table statistics
SELECT '=== TABLE STATISTICS ===' AS info;
SELECT 
    TABLE_NAME,
    COLUMN_COUNT,
    TABLE_ROWS,
    AVG_ROW_LENGTH,
    DATA_LENGTH
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;
