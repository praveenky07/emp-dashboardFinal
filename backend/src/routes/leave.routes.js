const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/apply', protect, leaveController.applyLeave);
router.get('/my', protect, leaveController.getLeaves);
router.post('/cancel/:id', protect, leaveController.cancelLeave);
router.get('/balance', protect, leaveController.getLeaveBalances);

// Standardized management routes
router.get('/pending', protect, authorize(['manager', 'admin', 'hr']), leaveController.getAllPendingLeaves);
router.get('/all-pending', protect, authorize(['manager', 'admin', 'hr']), leaveController.getAllPendingLeaves); // Backwards compatibility
router.get('/team', protect, authorize(['manager', 'admin', 'hr']), leaveController.getTeamLeaves);

// Match USER's specific request: PUT /api/leaves/update-status
router.put('/update-status', protect, authorize(['manager', 'admin', 'hr']), leaveController.updateLeaveStatus);
router.post('/status/:id', protect, authorize(['manager', 'admin', 'hr']), leaveController.updateLeaveStatus); // Backwards compatibility for AdminPanel

module.exports = router;
