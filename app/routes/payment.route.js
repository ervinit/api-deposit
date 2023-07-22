const express = require('express');
const paymentController = require('../controllers/payment.controller');
const jwt = require("jsonwebtoken");

const router = express.Router()

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'superSecret', (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {    
        res.sendStatus(401);
    }
};

router.get('/dashboard', authenticateJWT, paymentController.dashboard);
router.get('/trxList', authenticateJWT, paymentController.trxList);
router.post('/trxHash', authenticateJWT, paymentController.trxHash);
router.post('/withdraw', authenticateJWT, paymentController.withdraw);

module.exports = router;