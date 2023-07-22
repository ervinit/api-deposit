const express = require('express');
const usersController = require('../controllers/user.controller.js');

const router = express.Router()

router.post('/login', usersController.login);
router.post('/verify', usersController.verify);
router.get('/logout', usersController.logout);

module.exports = router;