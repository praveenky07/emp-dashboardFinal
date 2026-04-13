const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/users', protect, chatController.getChatUsers);
router.get('/conversations', protect, chatController.getConversations);
router.post('/conversations/direct/:targetUserId', protect, chatController.getOrCreateDirectConversation);
router.post('/conversations/group', protect, chatController.createGroupConversation);
router.get('/conversations/:conversationId/messages', protect, chatController.getChatHistory);

router.get('/notifications', protect, chatController.getNotifications);
router.post('/notifications/read', protect, chatController.markNotificationsRead);

module.exports = router;
