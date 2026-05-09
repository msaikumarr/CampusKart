const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
dotenv.config({ path: path.join(__dirname, '.env') });
const { JWT_SECRET, MONGODB_URI, CLIENT_ORIGINS, isProduction } = require('./config/env');
const passport = require('./config/passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const server = http.createServer(app);
const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'];
const ALLOWED_ORIGINS = CLIENT_ORIGINS.length > 0 ? CLIENT_ORIGINS : DEV_ORIGINS;
const io = socketIo(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true
  }
});

const onlineUserSocketCounts = new Map();
const lastSeenMap = new Map();

// Middleware
if (isProduction) {
  // Required so secure cookies work correctly behind Render's proxy.
  app.set('trust proxy', 1);
}

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));

// Session middleware for Passport
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    ttl: 24 * 60 * 60,
    autoRemove: 'native'
  }),
  cookie: {
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log("MongoDB Atlas Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err.message));

// Routes
const ItemRoutes=require('./routes/ItemRoutes')
const authRoutes = require('./routes/AuthRoutes');
const userRoutes = require('./routes/userRoutes');
const wishlistRoutes=require('./routes/wishlistRoutes')
const chatRoutes = require('./routes/ChatRoutes');
const paymentRoutes = require('./routes/PaymentRoutes');
const orderRoutes = require('./routes/OrderRoutes');
const adminRoutes = require('./routes/AdminRoutes');
const reviewRoutes = require('./routes/ReviewRoutes');
const savedSearchRoutes = require('./routes/SavedSearchRoutes');
const safetyRoutes = require('./routes/SafetyRoutes');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/items",ItemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wishlist',wishlistRoutes)
app.use('/api/chat', chatRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/saved-searches', savedSearchRoutes);
app.use('/api/safety', safetyRoutes);

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinUserRoom', (userId) => {
    if (!userId) return;
    socket.data.userId = userId;
    socket.join(`user_${userId}`);
    const prevCount = onlineUserSocketCounts.get(userId) || 0;
    onlineUserSocketCounts.set(userId, prevCount + 1);
    io.emit('presenceUpdate', { userId, online: true, lastSeen: null });
    console.log(`User ${socket.id} joined user room: user_${userId}`);
  });

  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat room: ${chatId}`);
  });

  socket.on('typingStart', ({ chatId, userId }) => {
    if (!chatId || !userId) return;
    socket.to(chatId).emit('typing', { chatId, userId, typing: true });
  });

  socket.on('typingStop', ({ chatId, userId }) => {
    if (!chatId || !userId) return;
    socket.to(chatId).emit('typing', { chatId, userId, typing: false });
  });

  socket.on('requestPresence', ({ userId }) => {
    if (!userId) return;
    const online = (onlineUserSocketCounts.get(userId) || 0) > 0;
    const lastSeen = lastSeenMap.get(userId) || null;
    socket.emit('presenceUpdate', { userId, online, lastSeen });
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { chatId, message, senderId } = data;
      
      // Fetch sender info to include in broadcast
      const User = require('./models/User');
      const sender = await User.findById(senderId).select('username _id');
      
      // Broadcast message to all users in this chat room with populated sender info
      io.to(chatId).emit('newMessage', { 
        chatId, 
        message, 
        sender: sender,  // Send full sender object instead of just senderId
        timestamp: new Date()
      });
      console.log(`Message sent in chat ${chatId} by ${senderId}`);
    } catch (error) {
      console.error('Socket.io sendMessage error:', error);
    }
  });

  socket.on('disconnect', () => {
    const userId = socket.data.userId;
    if (userId) {
      const prevCount = onlineUserSocketCounts.get(userId) || 0;
      const nextCount = Math.max(0, prevCount - 1);
      if (nextCount === 0) {
        onlineUserSocketCounts.delete(userId);
        const seenAt = new Date().toISOString();
        lastSeenMap.set(userId, seenAt);
        io.emit('presenceUpdate', { userId, online: false, lastSeen: seenAt });
      } else {
        onlineUserSocketCounts.set(userId, nextCount);
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(` Server running on port ${PORT}`));

// Export io for use in controllers
module.exports.io = io;