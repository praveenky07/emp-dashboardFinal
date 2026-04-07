const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth.middleware');
const { uploadProfileImage } = require('../controllers/upload.controller');

router.post('/profile', protect, upload.single('image'), uploadProfileImage);

module.exports = router;
