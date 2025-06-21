const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// Get all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.userId;

    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'username displayName avatar lastSeen')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'username displayName'
      }
    })
    .sort({ lastActivity: -1 });

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
};

// Get or create a conversation
exports.getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    // Check if conversation exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] }
    })
    .populate('participants', 'username displayName avatar lastSeen')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'username displayName'
      }
    });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [userId, otherUserId]
      });
      await conversation.save();
      
      // Populate the new conversation
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'username displayName avatar lastSeen');
    }

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Get/create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get or create conversation',
      error: error.message
    });
  }
};

// Get messages for a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.userId
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation'
      });
    }

    const messages = await Message.find({
      conversation: conversationId
    })
    .populate('sender', 'username displayName avatar')
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    res.json({
      success: true,
      messages: messages.reverse(),
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        read: false
      },
      { read: true }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message
    });
  }
};