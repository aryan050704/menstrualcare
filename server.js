const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const config = require('./config');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: config.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true
}));

// Socket.IO middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    socket.user = decoded.user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.user.id);

  // Join user's personal room
  socket.join(socket.user.id);

  // Handle joining chat rooms
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
  });

  // Handle leaving chat rooms
  socket.on('leaveChat', (chatId) => {
    socket.leave(chatId);
  });

  // Handle new messages
  socket.on('sendMessage', async (data) => {
    const { chatId, message } = data;
    io.to(chatId).emit('newMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.id);
  });
});

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', config.MONGODB_URI);

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    console.log('Connection state:', mongoose.connection.readyState);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code
    });
    process.exit(1);
  });

// Add connection event listeners
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cycle', require('./routes/cycle'));
app.use('/api/health', require('./routes/health'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/chatbot', require('./routes/chatbot'));

// Serve static assets in production
if (config.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  console.error('Stack trace:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: config.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = config.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', config.NODE_ENV);
  console.log('CORS enabled for:', config.CLIENT_URL);
}); 