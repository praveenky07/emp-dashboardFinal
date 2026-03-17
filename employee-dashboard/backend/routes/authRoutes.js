const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

// @route   POST /api/auth/login
// @desc    Admin login
// @access  Public
router.post('/login', login);

module.exports = router;
