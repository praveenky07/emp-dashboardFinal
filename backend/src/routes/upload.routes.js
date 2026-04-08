const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth.middleware');
const { uploadProfileImage, uploadFile } = require('../controllers/upload.controller');

router.post('/profile', protect, upload.single('image'), uploadProfileImage);
router.post('/file', protect, upload.single('file'), uploadFile);

module.exports = router;
