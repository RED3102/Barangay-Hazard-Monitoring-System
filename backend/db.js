const mysql = require('mysql2/promise');
const fs    = require('fs');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT, 10) || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync('./ca.pem'),
  },
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
});

pool.getConnection()
  .then(connection => {
    console.log('Connected to Aiven MySQL database');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
  });

module.exports = pool;