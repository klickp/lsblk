/**
 * Script to remove all fake/test data from the database
 * Run this to ensure only real orders are in the system
 */

const pool = require('./db');

async function clearFakeData() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    console.log('✓ Connected to database');
    
    // Check current data
    const [currentOrders] = await connection.query('SELECT COUNT(*) as count FROM Orders');
    const [currentItems] = await connection.query('SELECT COUNT(*) as count FROM Order_Items');
    const [currentPayments] = await connection.query('SELECT COUNT(*) as count FROM Payment_Transactions');
    
    console.log('\nCurrent database state:');
    console.log(`  Orders: ${currentOrders[0].count}`);
    console.log(`  Order Items: ${currentItems[0].count}`);
    console.log(`  Payment Transactions: ${currentPayments[0].count}`);
    
    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will delete ALL orders, order items, and payment transactions!');
    console.log('This action cannot be undone.');
    console.log('\nTo proceed, set CONFIRM_DELETE=true when running this script:');
    console.log('CONFIRM_DELETE=true node clear-fake-data.js\n');
    
    if (process.env.CONFIRM_DELETE !== 'true') {
      console.log('❌ Deletion cancelled. No data was removed.');
      connection.release();
      process.exit(0);
    }
    
    // Begin transaction
    await connection.beginTransaction();
    
    // Delete in correct order due to foreign key constraints
    console.log('\nDeleting data...');
    
    await connection.query('DELETE FROM Order_Items');
    console.log('✓ Cleared Order_Items');
    
    await connection.query('DELETE FROM Payment_Transactions');
    console.log('✓ Cleared Payment_Transactions');
    
    await connection.query('DELETE FROM Orders');
    console.log('✓ Cleared Orders');
    
    // Reset auto-increment counters
    await connection.query('ALTER TABLE Orders AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE Order_Items AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE Payment_Transactions AUTO_INCREMENT = 1');
    console.log('✓ Reset auto-increment counters');
    
    // Commit transaction
    await connection.commit();
    
    // Verify deletion
    const [finalOrders] = await connection.query('SELECT COUNT(*) as count FROM Orders');
    const [finalItems] = await connection.query('SELECT COUNT(*) as count FROM Order_Items');
    const [finalPayments] = await connection.query('SELECT COUNT(*) as count FROM Payment_Transactions');
    
    console.log('\n✅ Database cleaned successfully!');
    console.log('\nFinal database state:');
    console.log(`  Orders: ${finalOrders[0].count}`);
    console.log(`  Order Items: ${finalItems[0].count}`);
    console.log(`  Payment Transactions: ${finalPayments[0].count}`);
    console.log('\nAll fake/test data has been removed. Only real orders will be tracked from now on.');
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

clearFakeData();
