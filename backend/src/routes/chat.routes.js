const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/users', protect, chatController.getChatUsers);
router.get('/private/:otherUserId', protect, chatController.getChatHistory);
router.get('/group/:groupId', protect, chatController.getGroupHistory);
router.get('/notifications', protect, chatController.getNotifications);
router.post('/notifications/read', protect, chatController.markNotificationsRead);

module.exports = router;
