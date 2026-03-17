const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { logMeeting, getMyMeetings, getAllMeetings } = require('../controllers/meetingController');

router.use(protect);

// Employee can log and see their own meetings
router.post('/log', logMeeting);
router.get('/my', getMyMeetings);

// Admin and Manager can see all meetings
router.get('/', authorize('Admin', 'Manager'), getAllMeetings);

module.exports = router;
