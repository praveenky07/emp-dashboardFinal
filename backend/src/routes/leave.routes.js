const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { authorize } = require('../middleware/auth.middleware');

router.post('/apply', leaveController.applyLeave);
router.get('/my-leaves', leaveController.getLeaves);
router.get('/all-pending', authorize(['Manager', 'Admin']), leaveController.getAllPendingLeaves);
router.post('/update-status', authorize(['Manager', 'Admin']), leaveController.updateLeaveStatus);

module.exports = router;
