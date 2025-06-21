const Message = require('../models/Message');
const User = require('../models/User');

// Get all messages between two users
exports.getMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    })
    .sort({ timestamp: 1 })
    .populate('sender', 'username')
    .populate('receiver', 'username');

    res.json({
      success: true,
      messages
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

// Get other user
exports.getOtherUser = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Find the other user (not the current user)
    const otherUser = await User.findOne({ _id: { $ne: userId } })
      .select('username _id');

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'No other user found'
      });
    }

    res.json({
      success: true,
      user: otherUser
    });
  } catch (error) {
    console.error('Get other user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch other user',
      error: error.message
    });
  }
};