const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'user_dashboard',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 🔥 Test DB connection explicitly
(async () => {
  try {
    await pool.promise().query('SELECT 1');
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
})();

module.exports = pool.promise();
