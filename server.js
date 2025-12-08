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
    version: "1.0.0",
    frontend: "https://sunriserealestate.netlify.app",
    endpoints: {
      health: "/api/health",
      signup: "POST /signup",
      contact: "POST /contact",
      customer_details: "GET /customer_details",
      search: "POST /search",
      search_data: "GET /search_data",
      search_stats: "GET /search_stats",
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

// ---------- GET ALL CUSTOMER DETAILS ----------
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

// ---------- SEARCH DATA ----------
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

// ---------- SEARCH STATS ----------
app.get('/search_stats', (req, res) => {
  console.log("📈 Fetching search statistics");
  
  const queries = [
    'SELECT COUNT(*) as total_searches FROM search',
    'SELECT property, COUNT(*) as count FROM search GROUP BY property ORDER BY count DESC LIMIT 1',
    'SELECT DATE(created_at) as date, COUNT(*) as daily_searches FROM search GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 7'
  ];

  Promise.all(queries.map(q => {
    return new Promise((resolve, reject) => {
      pool.query(q, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }))
  .then(results => {
    res.json({
      success: true,
      app: "Sunrise Real Estate",
      totalSearches: results[0][0]?.total_searches || 0,
      mostSearchedType: results[1][0]?.property || 'N/A',
      mostSearchedCount: results[1][0]?.count || 0,
      last7Days: results[2] || [],
      timestamp: new Date().toISOString()
    });
  })
  .catch(err => {
    console.error("❌ Search stats error:", err.message);
    res.status(500).json({ 
      error: 'Error fetching search statistics',
      details: err.message 
    });
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
      'POST /signup',
      'POST /contact',
      'GET /customer_details',
      'POST /search',
      'GET /search_data',
      'GET /search_stats'
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
  🚀 ================================================ 🚀
  `);
  
  console.log(`\n✅ Ready to accept requests from:`);
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