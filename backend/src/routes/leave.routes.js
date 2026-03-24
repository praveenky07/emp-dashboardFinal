const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { authorize } = require('../middleware/auth.middleware');

router.post('/apply', leaveController.applyLeave);
router.get('/my', leaveController.getLeaves);
router.get('/team', authorize(['manager', 'admin']), leaveController.getTeamLeaves);
router.get('/all-pending', authorize(['manager', 'admin']), leaveController.getAllPendingLeaves);
router.post('/update-status', authorize(['manager', 'admin']), leaveController.updateLeaveStatus);

module.exports = router;
