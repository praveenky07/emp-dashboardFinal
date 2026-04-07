const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/apply', protect, leaveController.applyLeave);
router.get('/my', protect, leaveController.getLeaves);
router.post('/cancel/:id', protect, leaveController.cancelLeave);

// Professional Balance Routes
router.get('/balance/my', protect, leaveController.getLeaveBalances);
router.get('/balance/all', protect, authorize(['manager', 'admin', 'hr']), leaveController.getAllLeaveBalances);
router.get('/balance', protect, leaveController.getLeaveBalances); // Backwards compatibility

// Professional Approval Routes
router.put('/approve', protect, authorize(['manager', 'admin', 'hr']), leaveController.updateLeaveStatus);
router.put('/update-status', protect, authorize(['manager', 'admin', 'hr']), leaveController.updateLeaveStatus); // Backwards compatibility

// Standardized management routes
router.get('/pending', protect, authorize(['manager', 'admin', 'hr']), leaveController.getAllPendingLeaves);
router.get('/team', protect, authorize(['manager', 'admin', 'hr']), leaveController.getTeamLeaves);
router.post('/status/:id', protect, authorize(['manager', 'admin', 'hr']), leaveController.updateLeaveStatus); // Backwards compatibility for AdminPanel

module.exports = router;
