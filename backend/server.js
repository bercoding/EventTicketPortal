require('dotenv').config();

// backend/server.js
const express = require('express');
const http = require('http'); // Import http
const { Server } = require("socket.io"); // Import Server from socket.io
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/event');
const reviewRoutes = require('./routes/review');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/userRoutes'); // Import userRoutes
const ticketRoutes = require('./routes/ticketRoutes'); // Import ticketRoutes
const bookingRoutes = require('./routes/bookingRoutes'); // Import bookingRoutes
const postRoutes = require('./routes/post'); // Add missing import
const commentRoutes = require('./routes/comment'); // Add missing import
const venueRoutes = require('./routes/venue'); // Add missing import
const socketHandler = require('./socket/socketHandler'); // Sẽ tạo file này sau
const contentRoutes = require('./routes/contentRoutes');
const mongoose = require('mongoose');
const path = require('path');
const { createServer } = require('http');
const socketIo = require('socket.io');
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

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    return res.status(200).json({});
  }
  next();
});
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/users', userRoutes); // Sử dụng userRoutes
app.use('/api/tickets', ticketRoutes); // Sử dụng ticketRoutes
app.use('/api/bookings', bookingRoutes); // Sử dụng bookingRoutes
app.use('/api/payments', require('./routes/payment')); // Sử dụng paymentRoutes
app.use('/api/content', contentRoutes);

app.use(express.static('public', {
  maxAge: '1d',
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=86400');
  }
}));

// Serve uploaded files
app.use('/uploads', express.static('uploads', {
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

server.listen(PORT, () => console.log(`Server running on port ${PORT} and WebSocket is ready`)); // Lắng nghe trên server thay vì app