var mysql = require("mysql2");

var con = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"contact_form",
    port:3307
});

module.exports = con;
