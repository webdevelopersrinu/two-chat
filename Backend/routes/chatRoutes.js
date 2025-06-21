const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/conversations', authenticate, chatController.getConversations);
router.get('/conversation/:otherUserId', authenticate, chatController.getOrCreateConversation);
router.get('/messages/:conversationId', authenticate, chatController.getMessages);
router.put('/messages/:conversationId/read', authenticate, chatController.markAsRead);

module.exports = router;