const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');

// Protected routes
router.get('/messages/:otherUserId', authenticate, chatController.getMessages);
router.get('/other-user', authenticate, chatController.getOtherUser);

module.exports = router;