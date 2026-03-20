const express = require('express');
const router = express.Router();
const pulseController = require('../controllers/pulse.controller');

router.get('/frontend', pulseController.getFrontendPulse);
router.get('/deadlines', pulseController.getUpcomingDeadlines);

module.exports = router;
