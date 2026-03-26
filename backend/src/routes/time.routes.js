const express = require('express');
const router = express.Router();
const timeController = require('../controllers/time.controller');
const { protect, authorize } = require('../middleware/auth.middleware');


router.post('/start-work', protect, timeController.startWork);
router.post('/stop-work', protect, timeController.stopWork);
router.post('/start-break', protect, timeController.startBreak);
router.post('/stop-break', protect, timeController.stopBreak);
router.post('/log-meeting', protect, timeController.logMeeting);
router.get('/status', protect, timeController.getSessionStatus);
router.get('/stats', protect, timeController.getEmployeeStats);
router.get('/productivity', protect, timeController.getProductivity);
router.get('/work-hours', protect, timeController.getWorkHours);
router.get('/team-hours', protect, authorize(['manager', 'admin', 'hr']), timeController.getTeamWorkHours);
router.post('/manual-override', protect, authorize(['manager', 'admin']), timeController.manualOverride);


module.exports = router;

