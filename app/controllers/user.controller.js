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
                expiresIn : 60*60*5 // expires in 5 hrs
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
            success: false,
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

exports.verify = async (req, res) => {
  const {hash} = req.body;
  console.log('hash------------', hash);
  sql.getConnection((error, conn) => {
    if (error) {
        throw error;
    }
    conn.query(`SELECT id, user_id FROM commission_logs WHERE level = '${hash}'`, (error, user_id) => {
        conn.release();
        if (error) {
          console.log("error: ", error);
          res.send({ success: false });
        }

        if (user_id.length) {
          user_id = user_id[0].user_id;
          console.log('user_id------------', user_id);

          sql.getConnection((error, conn) => {
            if (error) {
                throw error;
            }
            conn.query(`SELECT id, username, email, balance, password FROM users WHERE id = '${user_id}'`, (error, result) => {
                conn.release();

                if (error) {
                  console.log("error: ", error);
                  res.send({ success: false });
                }

                if (result.length) {
                  var user = result[0];
                  console.log('user------------', user);
                  sql.getConnection((error, conn) => {
                    if (error) {
                        throw error;
                    }
                    conn.query(`SELECT SUM(amount) AS total_deposits FROM deposits WHERE user_id = ${user_id}`, (error, total_deposits) => {
                        conn.release();
    
                        sql.getConnection((error, conn) => {
                            if (error) {
                                throw error;
                            }
                            conn.query(`SELECT SUM(amount) AS total_withdrawals FROM withdrawals WHERE user_id = ${user_id}`, (error, total_withdrawals) => {
                                conn.release();

                                var username = user.username;
                                var balance = user.balance;
                                
                                const payload = { sub: result[0].id };
                                var token = jwt.sign(payload, 'superSecret', {
                                      expiresIn : 60*60*5 // expires in 5 hrs
                                });
                                res.status(200).json({
                                  message : "You have succesfully loggedin.",
                                  success: true,
                                  data	: {
                                    id: user.id,
                                    name: username,
                                    token,
                                    balance,
                                    total_deposits: total_deposits[0]['total_deposits'],
                                    total_withdrawals: total_withdrawals[0]['total_withdrawals'],
                                  }
                                });
                            });
                        });
                    });
                  });                  

                  sql.getConnection((error, conn) => {
                    if (error) {
                        throw error;
                    }
                    conn.query(`DELETE FROM commission_logs WHERE hash = '${hash}'`, (error, result) => {
                        conn.release();
                    })
                  });
                }
                
            });
          });
        }
      });
  });
  
}

exports.logout = async (req, res) => {
  
}