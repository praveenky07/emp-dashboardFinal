const express = require('express');
const router = express.Router();
const timeController = require('../controllers/time.controller');

router.post('/start-work', timeController.startWork);
router.post('/stop-work', timeController.stopWork);
router.post('/start-break', timeController.startBreak);
router.post('/stop-break', timeController.stopBreak);
router.post('/log-meeting', timeController.logMeeting);
router.get('/status', timeController.getSessionStatus);
router.get('/stats', timeController.getEmployeeStats);
router.get('/productivity', timeController.getProductivity);
router.get('/work-hours', timeController.getWorkHours);

module.exports = router;
