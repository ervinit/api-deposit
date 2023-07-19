var async = require("async");
const moment = require('moment');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sql = require("../models/db");

exports.login = async (req, res) => {
  const {name, password} = req.body;
  
  sql.query(`SELECT id, username, email, balance, password FROM users WHERE username = '${name}'`, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.send({ success: false });
    }

    if (result.length) {
      var user = result[0];
      var old_password = user.password;
      var username = user.username;
      var balance = user.balance;
      old_password = old_password.replace(/^\$2y(.+)$/i, '$2a$1');
      bcrypt.compare(password, old_password, function(err, cresult) {
        if (err) {          
          return res.status(401).json({
            status : 401,
            success: false,
            message : "Invalid username or password.",
          });
        } else if (cresult) {
          const payload = { sub: result[0].id };
          var token = jwt.sign(payload, 'superSecret', {
                expiresIn : 60*60*0.5 // expires in 0.5 hours
          });
          res.status(200).json({
            message : "You have succesfully loggedin.",
            success: true,
            data	: {
              id: user.id,
              name: username,
              token,
              balance
            }
          });
        } else {
          return res.status(401).json({
            status : 401,
            message : "Invalid password.",
          });
        }
      });
    } else {
      return res.status(401).json({
        status : 401,
        success: false,
        message : "Invalid username and password.",
      });
    }
  });
};

exports.logout = async (req, res) => {
  
}