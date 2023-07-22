var express = require('express');
var jwt = require('jsonwebtoken');
var path = require('path')
var bodyParser = require('body-parser');
var cors = require('cors');
var empty  = require('is-empty');
var {getTransactionHashList} = require('./app/cron/transactionStatus');
const sql = require("./app/models/db");

sql.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      return;
    }
    console.log('Connected Database')
    connection.release();
});

var app = express();

app.use(bodyParser.urlencoded({ extended : true}));
app.use(bodyParser.json());

var port = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, 'dist')))
// Add headers before the routes are defined
app.use(cors({
    origin: '*'
}));

setInterval(getTransactionHashList, 5000);

const userRoute = require('./app/routes/user.route');
const paymentRoute = require('./app/routes/payment.route');

app.use('/api/auth', userRoute);
app.use('/api/pmt', paymentRoute);

app.listen(port, function() {
	console.log('Server is running on Port 3001');
});
