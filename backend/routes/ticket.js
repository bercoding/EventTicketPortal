const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { auth, requireAdminOrEventOwner } = require('../middleware/auth');

// Lấy danh sách vé của người dùng
router.get('/my-tickets', auth, ticketController.getUserTickets);

// Route xác thực vé qua QR code (dành cho admin/event owner)
router.post('/verify-qr', auth, requireAdminOrEventOwner, ticketController.verifyTicket);

// Route lấy thống kê vé theo sự kiện
router.get('/stats/:eventId', auth, requireAdminOrEventOwner, ticketController.getTicketStats);

// Route trả vé
router.post('/:id/return', auth, ticketController.returnTicket);

module.exports = router;
