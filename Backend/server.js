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
    origin: process.env.CLIENT_URL || 'https://two-chat.vercel.app',
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://two-chat.vercel.app',
  credentials: true
}));
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'https://two-chat.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');      
  next();
});

  
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

app.use("/",(req, res) => {
  res.send("Welcome to Two Chat API");  
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/multiuserchat', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.IO connection handling
// Socket.IO connection handling
const users = new Map();

global.io = io;
global.users = users;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user_connected', (userId) => {
    users.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} connected with socket ${socket.id}`);

    // Notify all users about online status
    io.emit('users_online', Array.from(users.keys()));
  });

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  socket.on('send_message', async (data) => {
    const { senderId, receiverId, message, conversationId, tempId, senderName } = data;
    console.log(`Message from ${senderId} to ${receiverId} in conversation ${conversationId}`);

    try {
      // Save message to database
      const Message = require('./models/Message');
      const Conversation = require('./models/Conversation');

      // Find conversation
      let conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        console.log('Conversation not found, creating new one');
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

      // Create and save message
      const newMessage = new Message({
        sender: senderId,
        conversation: conversation._id,
        message: message,
        timestamp: new Date()
      });

      await newMessage.save();

      // Populate sender info
      await newMessage.populate('sender', 'username displayName avatar');

      // Update conversation's last message
      conversation.lastMessage = newMessage._id;
      conversation.lastActivity = new Date();
      await conversation.save();

      // Create message data object
      const messageData = {
        _id: newMessage._id.toString(),
        sender: newMessage.sender,
        conversation: conversation._id.toString(),
        message: message,
        timestamp: newMessage.timestamp
      };

      console.log(`Emitting message to conversation room: ${conversation._id.toString()}`);

      // Emit to all sockets in the conversation room (including sender)
      io.to(conversation._id.toString()).emit('receive_message', messageData);

      // Also emit directly to receiver's socket if they're online but not in the room
      const receiverSocketId = users.get(receiverId);
      if (receiverSocketId) {
        console.log(`Also sending directly to receiver socket: ${receiverSocketId}`);
        io.to(receiverSocketId).emit('receive_message', messageData);

        // Send notification
        io.to(receiverSocketId).emit('new_message_notification', {
          conversationId: conversation._id.toString(),
          message: messageData,
          senderName: senderName
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message', tempId });
    }
  });

  socket.on('new_conversation_created', async (data) => {
    const { conversationId, participants } = data;

    console.log('New conversation created:', conversationId);

    try {
      // Get the full conversation data
      const Conversation = require('./models/Conversation');
      const conversation = await Conversation.findById(conversationId)
        .populate('participants', 'username displayName avatar lastSeen')
        .populate({
          path: 'lastMessage',
          populate: {
            path: 'sender',
            select: 'username displayName'
          }
        });

      if (!conversation) {
        console.error('Conversation not found');
        return;
      }

      // Notify all participants about the new conversation
      participants.forEach(participantId => {
        const participantSocketId = users.get(participantId);
        if (participantSocketId && participantSocketId !== socket.id) {
          console.log(`Notifying participant ${participantId} about new conversation`);
          io.to(participantSocketId).emit('new_conversation', {
            conversation: conversation
          });
        }
      });
    } catch (error) {
      console.error('Error broadcasting new conversation:', error);
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
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});