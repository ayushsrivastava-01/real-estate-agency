// server.js - Customized for Sunrise Real Estate
const express = require("express");
const cors = require('cors');
const bodyParser = require("body-parser");

// Import the connection pool
const pool = require("./Connection");

const app = express();

// ==================== CORS Configuration ====================
const allowedOrigins = [
  'https://sunriserealestate.netlify.app',  // ✅ YOUR NETLIFY URL
  'http://sunriserealestate.netlify.app',   // ✅ Without https
  'http://localhost:5500',                  // Local Live Server
  'http://localhost:3000',                  // Local React/Vite
  'http://127.0.0.1:5500',                 // Alternative localhost
  'http://localhost:8080'                  // Additional local port
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS Allowed: ${origin}`);
      callback(null, true);
    } else {
      console.log(`🚫 CORS Blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ==================== Middleware ====================
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
  next();
});

// ==================== ROOT & HEALTH ENDPOINTS ====================
app.get("/", (req, res) => {
  res.json({
    app: "Sunrise Real Estate Backend API",
    message: "🚀 Welcome to Sunrise Real Estate Backend!",
    version: "2.0.0",
    frontend: "https://sunriserealestate.netlify.app",
    endpoints: {
      health: "/api/health",
      signup: "POST /signup",
      contact: "POST /contact",
      customer_details: "GET /customer_details",
      contacts: "GET /contacts",          // ✅ NEW FOR ADMIN
      searches: "GET /searches",         // ✅ NEW FOR ADMIN
      search_stats: "GET /search_stats", // ✅ NEW FOR ADMIN
      search: "POST /search",
      search_data: "GET /search_data",
      check_tables: "GET /api/check-tables"
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
    
    connection.query('SELECT 1 + 1 AS result', (queryErr, results) => {
      connection.release();
      
      if (queryErr) {
        return res.status(500).json({ 
          status: 'error', 
          message: 'Database query failed',
          error: queryErr.message 
        });
      }
      
      res.json({ 
        status: 'ok', 
        message: 'Sunrise Real Estate API is healthy 🎯',
        frontend: 'https://sunriserealestate.netlify.app',
        database: 'connected',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    });
  });
});

// AUTO CREATE TABLES ON STARTUP
const createTables = () => {
  console.log('🔧 Checking/Creating database tables...');
  
  const tables = [
    `CREATE TABLE IF NOT EXISTS \`sign-up\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      address TEXT,
      contact VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS customer_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      number VARCHAR(20),
      query TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'new',  // ✅ ADDED STATUS FIELD
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    )`,
    
    `CREATE TABLE IF NOT EXISTS search (
      id INT AUTO_INCREMENT PRIMARY KEY,
      property VARCHAR(50),
      location VARCHAR(100),
      price VARCHAR(50),
      rooms VARCHAR(20),
      bathroom VARCHAR(20),
      area VARCHAR(50),
      pstatus VARCHAR(50),
      sort VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_property (property),
      INDEX idx_created_at (created_at)
    )`
  ];

  tables.forEach((sql, i) => {
    pool.query(sql, (err, result) => {
      if (err) {
        console.error(`❌ Table ${i+1} error:`, err.message);
      } else {
        console.log(`✅ Table ${i+1} ready`);
      }
    });
  });
};

// Server start pe call karo
createTables();

// ==================== DATABASE TABLES CHECK ====================
app.get("/api/check-tables", (req, res) => {
  const sql = "SHOW TABLES";
  pool.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ 
        error: 'Error checking tables',
        details: err.message 
      });
    }
    
    const tables = results.map(row => Object.values(row)[0]);
    res.json({ 
      app: "Sunrise Real Estate",
      tables: tables,
      count: tables.length,
      database: process.env.DB_NAME || 'contact_form'
    });
  });
});

// ==================== API ROUTES ====================

// ---------- SIGN-UP ----------
app.post("/signup", function (req, res) {
  try {
    console.log("📝 Signup attempt:", req.body);
    
    const { username, emailid, pass, address, contact } = req.body;
    
    // Validation
    if (!username || !emailid || !pass) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["username", "emailid", "pass"]
      });
    }
    
    const sql = "INSERT INTO `sign-up` (name, email, password, address, contact) VALUES (?, ?, ?, ?, ?)";
    
    pool.query(sql, [username, emailid, pass, address, contact], function (error, result) {
      if (error) {
        console.error("❌ Signup DB Error:", error.message);
        return res.status(500).json({ 
          error: "Database error", 
          details: error.message,
          code: error.code 
        });
      }
      
      console.log("✅ Signup successful for:", emailid);
      return res.status(201).json({ 
        success: true,
        message: "Account created successfully! Welcome to Sunrise Real Estate 🎉",
        userId: result.insertId,
        timestamp: new Date().toISOString()
      });
    });
  } catch (err) {
    console.error("❌ Signup exception:", err);
    res.status(500).json({ 
      error: "Internal server error",
      details: err.message 
    });
  }
});

// ---------- CONTACT FORM ----------
app.post("/contact", function (req, res) {
  try {
    console.log("📞 Contact form submission:", req.body);
    
    const { name, email, number, query } = req.body;
    
    if (!name || !email || !query) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["name", "email", "query"]
      });
    }
    
    const sql = "INSERT INTO `customer_details` (name, email, number, query) VALUES (?, ?, ?, ?)";
    
    pool.query(sql, [name, email, number, query], function (error, result) {
      if (error) {
        console.error("❌ Contact form DB Error:", error.message);
        return res.status(500).json({ 
          error: "Database error", 
          details: error.message 
        });
      }
      
      console.log("✅ Contact saved from:", email);
      return res.status(201).json({ 
        success: true,
        message: "Thank you for contacting Sunrise Real Estate! We'll get back to you soon. ✅",
        contactId: result.insertId,
        timestamp: new Date().toISOString()
      });
    });
  } catch (err) {
    console.error("❌ Contact form exception:", err);
    res.status(500).json({ 
      error: "Internal server error",
      details: err.message 
    });
  }
});

// ---------- GET ALL CUSTOMER DETAILS (FOR ADMIN) ----------
app.get('/customer_details', (req, res) => {
  console.log("📋 Fetching customer details");
  
  const sql = 'SELECT * FROM customer_details ORDER BY created_at DESC';
  
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Customer details error:", err.message);
      return res.status(500).json({ 
        error: 'Error retrieving data',
        details: err.message 
      });
    }
    
    res.json({
      success: true,
      app: "Sunrise Real Estate",
      count: results.length,
      data: results,
      timestamp: new Date().toISOString()
    });
  });
});

// ---------- GET ALL CONTACTS (FOR ADMIN PANEL - NEW ENDPOINT) ----------
app.get('/contacts', (req, res) => {
  console.log("📞 ADMIN: Fetching all contacts for admin panel");
  
  const sql = 'SELECT * FROM customer_details ORDER BY created_at DESC';
  
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Contacts error:", err.message);
      return res.status(500).json({ 
        error: 'Error retrieving contacts',
        details: err.message 
      });
    }
    
    // Format for admin panel
    const formattedResults = results.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.number,
      number: row.number,
      message: row.query,
      query: row.query,
      status: row.status || 'new',
      created_at: row.created_at,
      timestamp: row.created_at
    }));
    
    console.log(`✅ ADMIN: Found ${formattedResults.length} contacts`);
    
    // Send just the array (as admin panel expects)
    res.json(formattedResults);
  });
});

// ---------- PROPERTY SEARCH ----------
app.post("/search", function (req, res) {
  try {
    console.log("🔍 Property search:", req.body);
    
    const { property, location, price, rooms, bathroom, area, pstatus, sort } = req.body;
    
    // Save search to database
    const sql = "INSERT INTO `search` (property, location, price, rooms, bathroom, area, pstatus, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    
    pool.query(sql, [property, location, price, rooms, bathroom, area, pstatus, sort], function (error, result) {
      if (error) {
        console.error("❌ Search save error (non-critical):", error.message);
      } else {
        console.log("✅ Search saved to database");
      }
      
      // Return sample properties for Sunrise Real Estate
      const properties = [
        {
          id: 1,
          title: "Luxury Villa with Pool",
          type: "Villa",
          price: "₹2.5 Cr",
          location: "Greater Noida, Sector Alpha",
          bedrooms: "4 BHK",
          image: "https://sunriserealestate.netlify.app/Images/House%204.jpg",
          details: "Modern luxury villa with swimming pool and garden",
          area: "3500 sq.ft",
          status: "For Sale",
          link: "House 2.html"
        },
        {
          id: 2,
          title: "Premium Apartment",
          type: "Apartment",
          price: "₹85 Lakh",
          location: "Noida, Sector 62",
          bedrooms: "3 BHK",
          image: "https://sunriserealestate.netlify.app/Images/House%202.jpg",
          details: "Fully furnished apartment with amenities",
          area: "1800 sq.ft",
          status: "For Sale",
          link: "House 3.html"
        },
        {
          id: 3,
          title: "Commercial Space",
          type: "Commercial",
          price: "₹1.2 Cr",
          location: "Delhi, Connaught Place",
          bedrooms: "Office Space",
          image: "https://sunriserealestate.netlify.app/Images/House%201.jpg",
          details: "Prime commercial space in business district",
          area: "2500 sq.ft",
          status: "For Rent",
          link: "House 1.html"
        }
      ];
      
      // Filter based on search criteria (basic filtering)
      let filteredProperties = properties;
      
      if (property && property !== 'Any') {
        filteredProperties = filteredProperties.filter(p => p.type === property);
      }
      
      if (location && location !== 'Any') {
        filteredProperties = filteredProperties.filter(p => 
          p.location.toLowerCase().includes(location.toLowerCase())
        );
      }
      
      if (pstatus && pstatus !== 'Any') {
        filteredProperties = filteredProperties.filter(p => p.status === pstatus);
      }
      
      res.json({
        success: true,
        message: "Search completed successfully",
        searchId: result?.insertId || null,
        searchCriteria: { property, location, pstatus },
        properties: filteredProperties,
        count: filteredProperties.length,
        timestamp: new Date().toISOString()
      });
    });
  } catch (err) {
    console.error("❌ Search exception:", err);
    res.status(500).json({ 
      error: "Internal server error",
      details: err.message 
    });
  }
});

// ---------- SEARCH DATA (OLD VERSION) ----------
app.get('/search_data', (req, res) => {
  console.log("📊 Fetching search history");
  
  const sql = 'SELECT * FROM search ORDER BY created_at DESC LIMIT 50';
  
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Search data error:", err.message);
      return res.status(500).json({ 
        error: 'Error retrieving search data',
        details: err.message 
      });
    }
    
    res.json({
      success: true,
      app: "Sunrise Real Estate",
      count: results.length,
      data: results,
      timestamp: new Date().toISOString()
    });
  });
});

// ---------- GET ALL SEARCHES (FOR ADMIN PANEL - NEW ENDPOINT) ----------
app.get('/searches', (req, res) => {
  console.log("🔍 ADMIN: Fetching all searches for admin panel");
  
  const sql = 'SELECT * FROM search ORDER BY created_at DESC';
  
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Searches error:", err.message);
      return res.status(500).json({ 
        error: 'Error retrieving searches',
        details: err.message 
      });
    }
    
    // Format for admin panel
    const formattedResults = results.map(row => ({
      id: row.id,
      property: row.property,
      location: row.location,
      price: row.price,
      rooms: row.rooms,
      bathroom: row.bathroom,
      area: row.area,
      pstatus: row.pstatus,
      sort: row.sort,
      property_type: row.property,
      property_status: row.pstatus,
      budget: row.price,
      bedrooms: row.rooms,
      sort_by: row.sort,
      search_date: row.created_at,
      created_at: row.created_at,
      timestamp: row.created_at
    }));
    
    console.log(`✅ ADMIN: Found ${formattedResults.length} searches`);
    
    // Send just the array (as admin panel expects)
    res.json(formattedResults);
  });
});

// ---------- SEARCH STATS (ADMIN DASHBOARD) ----------
app.get('/search_stats', (req, res) => {
  console.log("📈 ADMIN: Fetching search statistics");
  
  const queries = {
    totalSearches: 'SELECT COUNT(*) as count FROM search',
    mostSearchedType: `
      SELECT property, COUNT(*) as count 
      FROM search 
      GROUP BY property 
      ORDER BY count DESC 
      LIMIT 1
    `,
    avgBudget: `
      SELECT ROUND(AVG(
        CASE 
          WHEN price LIKE '%crore%' THEN 100
          WHEN price LIKE '%lakh%' THEN 
            CAST(REPLACE(REPLACE(price, 'lakh', ''), ' ', '') AS DECIMAL)
          ELSE 5
        END
      )) as avg_budget FROM search WHERE price IS NOT NULL
    `
  };
  
  pool.query(queries.totalSearches, (err, totalResult) => {
    if (err) {
      console.error('Error fetching total searches:', err);
      return res.status(500).json({ error: true, message: 'Error fetching stats' });
    }
    
    pool.query(queries.mostSearchedType, (err, typeResult) => {
      if (err) {
        console.error('Error fetching most searched type:', err);
        return res.status(500).json({ error: true, message: 'Error fetching stats' });
      }
      
      pool.query(queries.avgBudget, (err, budgetResult) => {
        if (err) {
          console.error('Error fetching avg budget:', err);
          return res.status(500).json({ error: true, message: 'Error fetching stats' });
        }
        
        const stats = {
          totalSearches: totalResult[0]?.count || 0,
          mostSearchedType: typeResult[0] ? typeResult[0].property : 'N/A',
          mostSearchedCount: typeResult[0]?.count || 0,
          avgBudget: budgetResult[0]?.avg_budget 
            ? `₹${budgetResult[0].avg_budget} Lakh` 
            : 'N/A'
        };
        
        console.log('📊 ADMIN: Search Statistics:', stats);
        
        res.json({
          success: true,
          ...stats,
          timestamp: new Date().toISOString()
        });
      });
    });
  });
});

// ---------- CONTACT STATS (ADMIN DASHBOARD) ----------
app.get('/contact_stats', (req, res) => {
  console.log("📞 ADMIN: Fetching contact statistics");
  
  const queries = {
    totalContacts: 'SELECT COUNT(*) as count FROM customer_details',
    newMessages: 'SELECT COUNT(*) as count FROM customer_details WHERE status = "new"',
    todayContacts: `
      SELECT COUNT(*) as count FROM customer_details 
      WHERE DATE(created_at) = CURDATE()
    `
  };
  
  pool.query(queries.totalContacts, (err, totalResult) => {
    if (err) {
      console.error('Error fetching total contacts:', err);
      return res.status(500).json({ error: true, message: 'Error fetching stats' });
    }
    
    pool.query(queries.newMessages, (err, newResult) => {
      if (err) {
        console.error('Error fetching new messages:', err);
        return res.status(500).json({ error: true, message: 'Error fetching stats' });
      }
      
      pool.query(queries.todayContacts, (err, todayResult) => {
        if (err) {
          console.error('Error fetching today contacts:', err);
          return res.status(500).json({ error: true, message: 'Error fetching stats' });
        }
        
        const stats = {
          totalContacts: totalResult[0]?.count || 0,
          newMessages: newResult[0]?.count || 0,
          todayContacts: todayResult[0]?.count || 0
        };
        
        console.log('📞 ADMIN: Contact Statistics:', stats);
        
        res.json({
          success: true,
          ...stats,
          timestamp: new Date().toISOString()
        });
      });
    });
  });
});

// ---------- UPDATE CONTACT STATUS ----------
app.put('/contacts/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  console.log(`🔄 Updating contact ${id} status to: ${status}`);
  
  if (!['new', 'contacted', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  const sql = 'UPDATE customer_details SET status = ? WHERE id = ?';
  
  pool.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error('❌ Update status error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    console.log(`✅ Contact ${id} updated to ${status}`);
    res.json({ 
      success: true, 
      message: `Status updated to ${status}` 
    });
  });
});

// ==================== TEST ENDPOINTS ====================
app.get('/test', (req, res) => {
  res.json({
    app: "Sunrise Real Estate",
    message: "✅ Backend is working!",
    version: "2.0.0",
    frontend: "https://sunriserealestate.netlify.app",
    admin_panels: {
      contacts: "/contacts",
      searches: "/searches",
      contact_stats: "/contact_stats",
      search_stats: "/search_stats"
    },
    timestamp: new Date().toISOString()
  });
});

// ==================== ERROR HANDLING ====================
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    app: "Sunrise Real Estate",
    path: req.url,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'GET /test',
      'POST /signup',
      'POST /contact',
      'GET /customer_details',
      'GET /contacts',          // ✅ NEW
      'GET /searches',         // ✅ NEW
      'GET /search_stats',     // ✅ NEW
      'GET /contact_stats',    // ✅ NEW
      'POST /search',
      'GET /search_data',
      'PUT /contacts/:id/status'
    ]
  });
});

app.use((err, req, res, next) => {
  console.error('🛑 Sunrise Real Estate Error:', err.stack);
  
  res.status(500).json({ 
    error: 'Internal server error',
    app: "Sunrise Real Estate",
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong! Please try again.' 
      : err.message,
    support: 'Contact support@sunriserealestate.com',
    timestamp: new Date().toISOString()
  });
});

// ==================== SERVER START ====================
const PORT = process.env.PORT || 1000;
const server = app.listen(PORT, () => {
  console.log(`
  🚀 ================================================ 🚀
      SUNRISE REAL ESTATE BACKEND STARTED!
      
  🌅 App: Sunrise Real Estate
  🌐 Frontend: https://sunriserealestate.netlify.app
  📡 Backend Port: ${PORT}
  🗄️  Database: ${process.env.DB_NAME || 'contact_form'}
  🎯 Health: http://localhost:${PORT}/api/health
  ✅ Test: http://localhost:${PORT}/test
  🚀 ================================================ 🚀
  `);
  
  console.log(`\n✅ Admin Panel APIs:`);
  console.log(`   • Contacts: http://localhost:${PORT}/contacts`);
  console.log(`   • Searches: http://localhost:${PORT}/searches`);
  console.log(`   • Contact Stats: http://localhost:${PORT}/contact_stats`);
  console.log(`   • Search Stats: http://localhost:${PORT}/search_stats`);
  
  console.log(`\n✅ Frontend URLs:`);
  allowedOrigins.forEach(origin => {
    console.log(`   • ${origin}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Sunrise Real Estate shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed');
    pool.end(() => {
      console.log('✅ Database pool closed');
      process.exit(0);
    });
  });
});