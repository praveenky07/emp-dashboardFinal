const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/clock-in', protect, attendanceController.clockIn);
router.post('/start', protect, attendanceController.clockIn);
router.post('/clock-out', protect, attendanceController.clockOut);
router.post('/end', protect, attendanceController.clockOut);
router.get('/my', protect, attendanceController.getMyAttendance);
router.get('/team', protect, authorize('manager', 'admin'), attendanceController.getTeamAttendance);
router.get('/admin', protect, authorize('admin'), attendanceController.getAdminAttendance);

module.exports = router;
