const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meeting.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect); // All meeting routes are protected

// POST /meetings → create meeting
router.post('/', meetingController.createMeeting);

// GET /meetings → role-based filtering
router.get('/', meetingController.getMeetings);

// GET /meetings/analytics → admin only
router.get('/analytics', authorize('Admin'), meetingController.getAnalytics);

// GET /meetings/:id → meeting details
router.get('/:id', meetingController.getMeetingById);

// PUT /meetings/:id → update meeting
router.put('/:id', meetingController.updateMeeting);

// DELETE /meetings/:id → admin or creator
router.delete('/:id', meetingController.deleteMeeting);

// POST /meetings/:id/join → track join
router.post('/:id/join', meetingController.joinMeeting);

module.exports = router;
