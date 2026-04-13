const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', userController.getUsers);
router.get('/profile', userController.getProfile);
router.get('/available', userController.getAvailableUsers);

module.exports = router;
