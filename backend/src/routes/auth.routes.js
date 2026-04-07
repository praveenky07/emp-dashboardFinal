const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/login', authController.login);
router.post('/register', authController.register);

router.post('/update-profile', protect, authController.updateProfile);
router.post('/update-password', protect, authController.updatePassword);

router.get('/github', authController.githubLogin);
router.get('/github/callback', authController.githubCallback);

module.exports = router;
