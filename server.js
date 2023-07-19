var express = require('express');
var jwt = require('jsonwebtoken');
var path = require('path')
var bodyParser = require('body-parser');
var empty  = require('is-empty');
var {getTransactionHashList} = require('./app/cron/transactionStatus');

var app = express();

app.use(bodyParser.urlencoded({ extended : true}));
app.use(bodyParser.json());

var port = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, 'dist')))
// Add headers before the routes are defined
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

setInterval(getTransactionHashList, 5000);

const userRoute = require('./app/routes/user.route');
const paymentRoute = require('./app/routes/payment.route');

app.use('/api/auth', userRoute);
app.use('/api/pmt', paymentRoute);

app.listen(port, function() {
	console.log('Server is running on Port 3001');
});
