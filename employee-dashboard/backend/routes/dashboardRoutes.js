const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDashboardStats } = require('../controllers/dashboardController');

router.use(protect);

// @route   GET /api/dashboard/stats
router.get('/stats', getDashboardStats);

module.exports = router;
