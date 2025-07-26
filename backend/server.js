require('dotenv').config();

// backend/server.js
const express = require('express');
const http = require('http'); // Import http
const { Server } = require("socket.io"); // Import Server from socket.io
const cors = require('cors');
const path = require('path'); // Import path module
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/event');
const reviewRoutes = require('./routes/review');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/userRoutes'); // Import userRoutes
const ticketRoutes = require('./routes/ticket'); // Sửa đường dẫn từ ticketRoutes.js thành ticket.js
const bookingRoutes = require('./routes/bookingRoutes'); // Import bookingRoutes
const postRoutes = require('./routes/post'); // Add missing import
const commentRoutes = require('./routes/comment'); // Add missing import
const venueRoutes = require('./routes/venue'); // Add missing import
const socketHandler = require('./socket/socketHandler'); // Sẽ tạo file này sau
const contentRoutes = require('./routes/contentRoutes');
const friendRoutes = require('./routes/friend'); // Sửa tham chiếu đúng tên file
const notificationRouter = require('./routes/notification'); // Import notification routes
const chatboxRouter = require('./routes/chatbox'); // Import chatbox routes

const mongoose = require('mongoose');
const cron = require('node-cron');
const { cancelExpiredTickets } = require('./services/ticketService');


const app = express();
const server = http.createServer(app); // Tạo HTTP server từ Express app
const io = new Server(server, { // Khởi tạo Socket.IO server
    cors: {
        origin: "http://localhost:3000", // Cho phép từ frontend localhost:3000
        methods: ["GET", "POST"]
    }
});

// CORS Configuration - Cho phép tất cả các requests từ frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/friends', friendRoutes); 
app.use('/api/users', userRoutes); // Sử dụng userRoutes
app.use('/api/tickets', ticketRoutes); // Sử dụng ticketRoutes
app.use('/api/bookings', bookingRoutes); // Sử dụng bookingRoutes
app.use('/api/payments', require('./routes/payment')); // Sử dụng paymentRoutes
app.use('/api/content', contentRoutes);
app.use('/api/notifications', notificationRouter); // Sử dụng notification routes
app.use('/api/chatbox', chatboxRouter); // Sử dụng chatbox routes
app.use('/api/owner', require('./routes/owner')); // Sử dụng owner routes

app.use(express.static('public', {
  maxAge: '1d',
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=86400');
  }
}));

// Serve uploaded files from public directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
  maxAge: '1d',
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=86400');
  }
}));

const PORT = process.env.PORT || 5001;

// Khởi chạy socket handler
socketHandler(io);

// Lưu io instance vào app để sử dụng trong các route
app.set('io', io);

// Cron job chạy mỗi phút để kiểm tra và hủy vé hết hạn
cron.schedule('* * * * *', async () => {
    console.log('🕒 Running ticket expiration check...');
    await cancelExpiredTickets();
});

// Thêm debug router
app.get('/api/debug/routes', (req, res) => {
  const routePaths = [];
  
  function print(path, layer) {
    if (layer.route) {
      layer.route.stack.forEach(print.bind(null, path));
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach(print.bind(null, path + (path ? layer.regexp.source.replace(/\\\//g, '/').replace(/\\\/\?\(\?\=\/\|$\)/g, '') : '')));
    } else if (layer.method) {
      routePaths.push({
        method: layer.method.toUpperCase(),
        path: path + (layer.regexp ? layer.regexp.source.replace(/\\\//g, '/').replace(/\\\/\?\(\?\=\/\|$\)/g, '') : '')
      });
    }
  }
  
  app._router.stack.forEach(print.bind(null, ''));
  
  res.json({ routes: routePaths });
});

// Add health check endpoint
app.get('/api/health-check', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend server is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start the server with socket.io
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Debug: log all registered routes
  console.log('\nRegistered Routes:');
  
  function print(path, layer) {
    if (layer.route) {
      layer.route.stack.forEach(function(stack) {
        if (stack.handle && stack.handle.name === 'handle') {
          console.log('%s %s', stack.method?.toUpperCase() || 'MIDDLEWARE', path + layer.route.path);
        }
      });
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach(print.bind(null, path + (path ? layer.regexp.source.replace(/\\\//g, '/').replace(/\\\/\?\(\?\=\/\|$\)/g, '') : '')));
    } else if (layer.method) {
      console.log('%s %s', layer.method.toUpperCase(), path + (layer.regexp ? layer.regexp.source.replace(/\\\//g, '/').replace(/\\\/\?\(\?\=\/\|$\)/g, '') : ''));
    }
  }
  
  app._router.stack.forEach(print.bind(null, ''));
});