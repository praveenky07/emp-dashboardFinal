const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { applyLeave, getAllLeaves, updateLeaveStatus } = require('../controllers/leaveController');

router.use(protect);

// @route   POST /api/leaves
router.post('/', applyLeave);

// @route   GET /api/leaves
router.get('/', getAllLeaves);

// @route   PUT /api/leaves/:id (Managers and Admins only)
router.put('/:id', authorize('Admin', 'Manager'), updateLeaveStatus);

module.exports = router;
