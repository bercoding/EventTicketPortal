const express = require('express');
const router = express.Router();
const { createEvent, getEvents, getEventById, updateEvent, deleteEvent, getEventsByOwnerId } = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

// Route công khai để xem sự kiện
router.get('/public', getEvents); // Không cần xác thực, có thể lọc theo visibility

// Route bảo mật cho quản lý sự kiện
router.route('/')
  .post(protect, createEvent)
  .get(protect, getEvents);

// New route to get events by owner ID
router.get('/owner/:ownerId', protect, getEventsByOwnerId);

router.route('/:id')
  .get(protect, getEventById)
  .put(protect, updateEvent)
  .delete(protect, deleteEvent);

module.exports = router;