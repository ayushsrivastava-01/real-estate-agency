// Connection.js - Sunrise Real Estate Database Connection
const mysql = require('mysql2');

console.log('🌅 Sunrise Real Estate - Initializing database connection...');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "contact_form",
  port: process.env.DB_PORT || 3306,
  
  // SSL for Aiven
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com') 
    ? { rejectUnauthorized: false } 
    : undefined,
  
  // Connection pool settings
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

console.log('🔧 Database Config:', {
  host: dbConfig.host,
  database: dbConfig.database,
  environment: process.env.NODE_ENV || 'development'
});

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ SUNRISE REAL ESTATE - Database Connection Failed:', {
      error: err.message,
      code: err.code,
      host: dbConfig.host,
      database: dbConfig.database
    });
    
    if (process.env.NODE_ENV === 'production') {
      console.error('🛑 Production: Database connection is critical. Exiting...');
      process.exit(1);
    }
  } else {
    console.log('✅ SUNRISE REAL ESTATE - Database Connected Successfully!');
    console.log('📊 Database:', dbConfig.database);
    console.log('🌐 Host:', dbConfig.host);
    
    // Test query
    connection.query('SELECT "Sunrise Real Estate" AS app_name', (queryErr, results) => {
      if (queryErr) {
        console.error('❌ Test query failed:', queryErr.message);
      } else {
        console.log('✅ Database test successful:', results[0].app_name);
      }
      connection.release();
    });
  }
});

// Pool error handler
pool.on('error', (err) => {
  console.error('🛑 Sunrise Real Estate - MySQL Pool Error:', err.message);
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Production: Logging error but continuing...');
  }
});

// Export the pool
module.exports = pool;