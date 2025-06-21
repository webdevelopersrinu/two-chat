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

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/twouserchat', {
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
    io.emit('users_online', Array.from(users.keys()));
  });

  socket.on('send_message', async (data) => {
    const { senderId, receiverId, message } = data;
    
    // Save message to database
    const Message = require('./models/Message');
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      message: message,
      timestamp: new Date()
    });
    
    await newMessage.save();
    
    // Send to receiver if online
    const receiverSocketId = users.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', {
        _id: newMessage._id,
        sender: senderId,
        message: message,
        timestamp: newMessage.timestamp
      });
    }
    
    // Send confirmation to sender
    socket.emit('message_sent', {
      _id: newMessage._id,
      timestamp: newMessage.timestamp
    });
  });

  socket.on('disconnect', () => {
    // Remove user from online users
    for (const [userId, socketId] of users.entries()) {
      if (socketId === socket.id) {
        users.delete(userId);
        io.emit('users_online', Array.from(users.keys()));
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});