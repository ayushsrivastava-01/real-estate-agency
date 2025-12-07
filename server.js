let con = require("./Connection");
let express = require("express");
const path = require("path");
const mysql = require('mysql2');
const cors = require('cors');
const session = require("express-session");
let bodyParser = require("body-parser");

let app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

con.connect((error) => {
  if (error) {
    console.error("Error connecting to MySQL database...", error);
    return;
  }
  console.log("Connected to MySQL database...");
});

// Sign-up route
app.post("/", function (req, res) {
  var name = req.body.username;
  var email = req.body.emailid;
  var password = req.body.pass;
  var address = req.body.address;
  var contact = req.body.contact;

  var sql =
    "INSERT INTO `sign-up` (name,email,password,address,contact) VALUES(?,?,?,?,?)";
  con.query(
    sql,
    [name, email, password, address, contact],
    function (error, result) {
      if (error) throw error;
      res.send(`<script>
                        alert("Congratulations! You have successfully Signed-Up...Welcome to 'Sunrise Real Estate Agency...'");
                        window.history.back();
                      </script>`);
    }
  );
});

// Contact form route
app.post("/contact", function (req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var number = req.body.number;
  var query = req.body.query;

  var sql =
    "INSERT INTO `customer_details` (name,email,number,query) VALUES(?,?,?,?)";
  con.query(sql, [name, email, number, query], function (error, result) {
    if (error) {
        console.error('Query Error:', error);
        return res.status(500).send('An error occurred while logging in.');
    }

    if (result.length > 0) {
      res.redirect("/Contact Form.html"); 
    } else {
      res.send(`
                    <script>
                        alert('Thank you! Your message has been sent successfully.');
                        window.location.href = '/Contact Form.html';
                    </script>
                `);
    }
  });
});

// Retrieve customer details for admin
app.get('/customer_details', (req, res) => {
  const sql = 'SELECT * FROM customer_details ORDER BY created_at DESC';
  con.query(sql, (err, results) => {
    if (err) {
      res.status(500).send('Error retrieving data');
    } else {
      res.json(results);
    }
  });
});

// Search route
app.post("/search", function (req, res) {
  var property = req.body.property;
  var location = req.body.location;
  var price = req.body.price;
  var rooms = req.body.rooms;
  var bathroom = req.body.bathroom;
  var area = req.body.area;
  var pstatus = req.body.pstatus;
  var sort = req.body.sort;

  var sql =
    "INSERT INTO `search` (property,location,price,rooms,bathroom,area,pstatus,sort) VALUES(?,?,?,?,?,?,?,?)";
  con.query(
    sql,
    [property, location, price, rooms, bathroom, area, pstatus, sort],
    function (error, result) {
      if (error) {
        console.error('Query Error:', error);
        return res.status(500).send('An error occurred while saving search.');
      }
      
      // After saving search, return some sample properties
      const sampleProperties = [
        {
            id: 1,
            title: "House for Sale",
            type: "House",
            price: "₹50 Lakh",
            location: "Greater Noida, Sector-55",
            bedrooms: "3 BHK",
            image: "Images/House 4.jpg",
            details: "Modern house and apartment",
            area: "1500 sq.ft",
            status: "For Sale",
            link: "House 2.html"  // Add link property
        },
        {
            id: 2,
            title: "Villa for Sale",
            type: "Villa",
            price: "₹1.2 Crore",
            location: "Banglore, Sector-45",
            bedrooms: "4 BHK",
            image: "Images/House.jpg",
            details: "Luxury villa with garden",
            area: "2500 sq.ft",
            status: "For Sale",
            link: "House 4.html"  // Add link property
        },
        {
            id: 3,
            title: "Flat for Rent",
            type: "Flat",
            price: "₹25,000/month",
            location: "Nagloi, Old Delhi",
            bedrooms: "2 BHK",
            image: "Images/bedroom 2.jpg",
            details: "Fully furnished flat",
            area: "1000 sq.ft",
            status: "For Rent",
            link: "House 6.html"  // Add link property
        }
      ];
      
      res.json(sampleProperties);
    }
  );
});

// Retrieve all search data for admin
app.get('/search_data', (req, res) => {
  const sql = 'SELECT * FROM search ORDER BY created_at DESC';
  con.query(sql, (err, results) => {
    if (err) {
      res.status(500).json({error: 'Error retrieving search data'});
    } else {
      res.json(results);
    }
  });
});

// Get search statistics
app.get('/search_stats', (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total_searches FROM search',
    'SELECT property, COUNT(*) as count FROM search GROUP BY property ORDER BY count DESC LIMIT 1',
    'SELECT AVG(CASE WHEN price LIKE "%lakh%" THEN REPLACE(price, "lakh", "") * 100000 WHEN price LIKE "%cr%" THEN REPLACE(price, "cr", "") * 10000000 ELSE 0 END) as avg_price FROM search'
  ];
  
  Promise.all(queries.map(query => {
    return new Promise((resolve, reject) => {
      con.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }))
  .then(results => {
    res.json({
      totalSearches: results[0].total_searches,
      mostSearchedType: results[1]?.property || 'N/A',
      avgBudget: results[2]?.avg_price ? `₹${Math.round(results[2].avg_price/100000)} Lakh` : 'N/A'
    });
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({error: 'Error fetching statistics'});
  });
});

// Route for admin pages
app.get('/Admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Admin.html'));
});

app.get('/SearchDetails.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'SearchDetails.html'));
});

app.get('/Details.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Details.html'));
});

// Serve all HTML files
app.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  if (filename.endsWith('.html')) {
    res.sendFile(path.join(__dirname, filename));
  }
});

app.listen(1000, () => {
  console.log("Server is running on port 1000");
  console.log("Access URLs:");
  console.log("1. User Search: http://localhost:1000/Search.html");
  console.log("2. Admin Panel: http://localhost:1000/Admin.html");
  console.log("3. Search Analytics: http://localhost:1000/SearchDetails.html");
  console.log("4. Contact Details: http://localhost:1000/Details.html");
});