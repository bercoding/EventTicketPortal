const express = require('express');
const router = express.Router();
const { getUserTickets, returnTicket } = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have this auth middleware

// @route   GET /api/tickets/my-tickets
// @desc    Get tickets for the logged in user
// @access  Private
router.get('/my-tickets', protect, getUserTickets);

// @route   POST /api/tickets/:id/return
// @desc    Return a ticket
// @access  Private
router.post('/:id/return', protect, returnTicket);

module.exports = router; 