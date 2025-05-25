const express = require('express');
const router = express.Router();
const { createEvent, getEvents, getEventById, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/auth'); // Giả định có middleware auth

router.route('/')
  .post(protect, createEvent) // Tạo sự kiện mới, cần xác thực
  .get(protect, getEvents);  // Lấy tất cả sự kiện, cần xác thực

router.route('/:id')
  .get(protect, getEventById)  // Lấy sự kiện theo ID, cần xác thực
  .put(protect, updateEvent)   // Cập nhật sự kiện, cần xác thực
  .delete(protect, deleteEvent); // Xóa sự kiện, cần xác thực

module.exports = router;