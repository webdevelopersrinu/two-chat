const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/multiuserchat', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.IO connection handling
const users = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user_connected', (userId) => {
    users.set(userId, socket.id);
    socket.userId = userId;
    
    // Notify all users about online status
    io.emit('users_online', Array.from(users.keys()));
  });

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
  });

  socket.on('send_message', async (data) => {
    const { senderId, receiverId, message, conversationId } = data;
    
    // Save message to database
    const Message = require('./models/Message');
    const Conversation = require('./models/Conversation');
    
    try {
      // Find or create conversation
      let conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        conversation = await Conversation.findOne({
          participants: { $all: [senderId, receiverId] }
        });
        
        if (!conversation) {
          conversation = new Conversation({
            participants: [senderId, receiverId]
          });
          await conversation.save();
        }
      }
      
      const newMessage = new Message({
        sender: senderId,
        conversation: conversation._id,
        message: message,
        timestamp: new Date()
      });
      
      await newMessage.save();
      
      // Update conversation's last message
      conversation.lastMessage = newMessage._id;
      conversation.lastActivity = new Date();
      await conversation.save();
      
      // Send to all users in the conversation
      io.to(conversation._id.toString()).emit('receive_message', {
        _id: newMessage._id,
        sender: senderId,
        conversation: conversation._id,
        message: message,
        timestamp: newMessage.timestamp
      });
      
      // Also send to receiver's socket if online
      const receiverSocketId = users.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_message_notification', {
          conversationId: conversation._id,
          message: newMessage,
          senderName: data.senderName
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  socket.on('typing', ({ conversationId, userId, isTyping }) => {
    socket.to(conversationId).emit('user_typing', { userId, isTyping });
  });

  socket.on('disconnect', () => {
    // Remove user from online users
    if (socket.userId) {
      users.delete(socket.userId);
      io.emit('users_online', Array.from(users.keys()));
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});