const express = require('express');
const router = express.Router();
const pulseController = require('../controllers/pulse.controller');
const { protect, authorize } = require('../middleware/auth.middleware');


router.get('/frontend', protect, authorize(['manager', 'admin']), pulseController.getFrontendPulse);
router.get('/deadlines', protect, authorize(['manager', 'admin']), pulseController.getUpcomingDeadlines);


module.exports = router;
