const express = require('express');
const router = express.Router();
const { 
  clockIn, 
  clockOut, 
  startBreak, 
  stopBreak, 
  logMeeting, 
  getSessionStatus, 
  getEmployeeStats, 
  getProductivity, 
  getWorkHours, 
  getTeamWorkHours, 
  manualOverride 
} = require('../controllers/time.controller');
const { protect, authorize } = require('../middleware/auth.middleware');


router.post('/clock-in', protect, clockIn);
router.post('/clock-out', protect, clockOut);
router.post('/start-break', protect, startBreak);
router.post('/stop-break', protect, stopBreak);
router.post('/log-meeting', protect, logMeeting);
router.get('/status', protect, getSessionStatus);
router.get('/stats', protect, getEmployeeStats);
router.get('/productivity', protect, getProductivity);
router.get('/work-hours', protect, getWorkHours);
router.get('/team-hours', protect, authorize(['manager', 'admin', 'hr']), getTeamWorkHours);
router.post('/manual-override', protect, authorize(['manager', 'admin']), manualOverride);


module.exports = router;

