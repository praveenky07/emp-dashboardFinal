const express = require('express');
const router = express.Router();
const managerController = require('../controllers/manager.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/team', protect, authorize(['manager', 'admin']), managerController.getTeamMembers);
router.get('/leaves', protect, authorize(['manager', 'admin']), managerController.getPendingLeaves);

module.exports = router;
