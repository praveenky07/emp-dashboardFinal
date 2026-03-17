const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { checkIn, checkOut, getAllAttendance } = require('../controllers/attendanceController');

router.use(protect);

// @route   POST /api/attendance/checkin
router.post('/checkin', checkIn);

// @route   POST /api/attendance/checkout
router.post('/checkout', checkOut);

// @route   GET /api/attendance
router.get('/', getAllAttendance);

module.exports = router;
