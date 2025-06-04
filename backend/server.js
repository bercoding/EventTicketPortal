// backend/server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/event');
const reviewRoutes = require('./routes/review');
const adminRoutes = require('./routes/admin');
const postRoutes = require('./routes/post');
const commentRoutes = require('./routes/comment');
const venueRoutes = require('./routes/venue');

require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/venues', venueRoutes);

app.use(express.static('public', {
  maxAge: '1d',
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=86400');
  }
}));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));