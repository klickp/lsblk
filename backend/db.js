const mysql = require('mysql2/promise')
const dns = require('dns')
const dotenv = require('dotenv')

dotenv.config()

// Override DNS resolver to use public DNS servers if system DNS fails
const customResolver = new dns.Resolver()
if (process.env.USE_PUBLIC_DNS === 'true') {
  customResolver.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1'])
  dns.setDefaultResultOrder('ipv4first')
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 4000,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Add error handling for connection pool
pool.on('error', (err) => {
  console.error('Pool error:', err)
})

module.exports = pool
