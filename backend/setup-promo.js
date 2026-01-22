const mysql = require('mysql2/promise');

async function setupPromoCodes() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'gateway01.us-west-2.prod.aws.tidbcloud.com',
      port: 4000,
      user: '4UwUxVj1YPTFSiW.root',
      password: '6JU5JqSBx4TBN2mE',
      database: 'test'
    });

    console.log('Connected to database');

    await connection.query(`
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
      )
    `);
    console.log('✅ Promo_Codes table created');

    await connection.query(`
      INSERT INTO Promo_Codes (code, description, type, discount_percent, discount_amount, min_order_amount, max_discount, is_active) 
      VALUES ('12345678', 'Special discount code', 'percentage', 20.00, 0.00, 10.00, 50.00, TRUE)
      ON DUPLICATE KEY UPDATE description = 'Special discount code'
    `);
    console.log('✅ Inserted promo code: 12345678');

    await connection.query(`
      INSERT INTO Promo_Codes (code, description, type, discount_percent, discount_amount, min_order_amount, max_discount, is_active) 
      VALUES 
        ('PIZZA2FOR1', 'Buy 2 Large Pizzas, Get 1 Medium Free', 'buy2get1', 0.00, 12.99, 30.00, 12.99, TRUE),
        ('SAVE20', '20% off your order', 'percentage', 20.00, 0.00, 25.00, 50.00, TRUE),
        ('FIRSTORDER', '$5 off your first order', 'fixed', 0.00, 5.00, 15.00, 5.00, TRUE),
        ('FREESHIP', 'Free delivery', 'delivery', 0.00, 3.99, 0.00, 3.99, TRUE)
      ON DUPLICATE KEY UPDATE description = VALUES(description)
    `);
    console.log('✅ Inserted additional promo codes');

    const [codes] = await connection.query('SELECT code, description FROM Promo_Codes');
    console.log('\n📋 Promo codes in database:');
    codes.forEach(code => {
      console.log(`  - ${code.code}: ${code.description}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

setupPromoCodes();
