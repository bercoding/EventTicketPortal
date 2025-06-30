const express = require('express');
const router = express.Router();
const { createBooking } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', protect, createBooking);

module.exports = router; 