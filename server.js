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
    console.error("Error connecting to MySQL database...", err);
    return;
  }
  console.log("Connected to MySQL database...");
});

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


//contact wala hai yaha

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
                        alert('Congratulations you are connected with us...');
                        // Go back to the previous page
                        window.history.back(); 
                    </script>
                `);
    }
  });
});

//retrieving
app.get('/customer_details', (req, res) => {
  const sql = 'SELECT * FROM customer_details';
  con.query(sql, (err, results) => {
    if (err) {
      res.status(500).send('Error retrieving data');
    } else {
      res.json(results);
    }
  });
});

//search wala hai yha

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
        return res.status(500).send('An error occurred while logging in.');
    }

    if (result.length > 0) {
      res.redirect("/Search.html"); 
    } else {
      res.send(`<script>
                    alert('See your related search below...');
                    // Go back to the previous page
                    window.history.back(); 
                  </script>
                `);
    }
    }
  );
});




app.listen(1000, () => {
  console.log("Server is running on port 1000");
});

