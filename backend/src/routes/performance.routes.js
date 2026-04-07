const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performance.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, performanceController.getPerformanceData);

module.exports = router;
