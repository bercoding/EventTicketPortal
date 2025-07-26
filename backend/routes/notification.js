const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const fetch = require('node-fetch');

// Đặt API key OpenAI ở biến môi trường OPENAI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Lấy danh sách thông báo
router.get('/', protect, getNotifications);

// Đánh dấu một thông báo là đã đọc
router.put('/:id/read', protect, markAsRead);

// Đánh dấu tất cả là đã đọc
router.put('/mark-all-as-read', protect, markAllAsRead);

module.exports = router; 