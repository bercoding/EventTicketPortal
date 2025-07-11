const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { 
    getUserTickets, 
    returnTicket, 
    verifyTicket, 
    getTicketStats 
} = require('../controllers/ticketController');
const { protect, requireAdminOrEventOwner } = require('../middleware/auth');

// @desc    Get user's tickets
// @route   GET /api/tickets
// @access  Private (User only)
router.get('/', protect, getUserTickets);

// @desc    Return ticket
// @route   POST /api/tickets/:ticketId/return
// @access  Private (User only)
router.post('/:ticketId/return', protect, returnTicket);

// @desc    Verify ticket by QR code
// @route   POST /api/tickets/verify
// @access  Private (Admin/Owner only)
router.post('/verify', protect, requireAdminOrEventOwner, verifyTicket);

// @route   GET /api/tickets/stats/:eventId
// @desc    Get ticket check-in statistics for an event
// @access  Private (Admin/Owner only)
router.get('/stats/:eventId', protect, requireAdminOrEventOwner, getTicketStats);

// @route   GET /api/tickets/debug/stats/:eventId
// @desc    Debug endpoint for ticket check-in statistics (returns mock data)
// @access  Private (Admin/Owner only) - for testing only
router.get('/debug/stats/:eventId', protect, requireAdminOrEventOwner, (req, res) => {
  // Dữ liệu mẫu cho việc kiểm thử
  const mockStats = {
    total: 100,
    used: 65,
    unused: 30,
    cancelled: 3,
    returned: 2,
    checkInsByHour: [
      { date: '2025-06-30', hour: 9, count: 8 },
      { date: '2025-06-30', hour: 10, count: 12 },
      { date: '2025-06-30', hour: 11, count: 15 },
      { date: '2025-06-30', hour: 12, count: 10 },
      { date: '2025-06-30', hour: 13, count: 20 }
    ]
  };
  
  res.status(200).json({
    success: true,
    stats: mockStats
  });
});

// @route   POST /api/tickets/debug/verify
// @desc    Debug endpoint for verifying tickets (returns mock data)
// @access  Private (Admin/Owner only) - for testing only
router.post('/debug/verify', protect, requireAdminOrEventOwner, (req, res) => {
  const { qrCode, eventId } = req.body;
  console.log('🔍 DEBUG VERIFY API ĐƯỢC GỌI:', qrCode, eventId);
  
  // Kiểm tra qrCode có phải là mã vé mẫu của test không
  const isSampleTicket = qrCode && qrCode.includes(`EVENT-${eventId}-TICKET`);
  const isAlreadyUsed = qrCode && qrCode.includes('-used');
  
  if (!qrCode) {
    return res.status(400).json({ 
      success: false, 
      message: 'Mã QR không được cung cấp' 
    });
  }
  
  if (isAlreadyUsed) {
    return res.status(400).json({
      success: false,
      message: 'Vé này đã được sử dụng',
      usedAt: new Date(),
      ticket: {
        id: `ticket-${Date.now()}`,
        event: { title: 'Sự kiện mẫu', id: eventId },
        user: { name: 'Người dùng mẫu', email: 'user@example.com' },
        seat: { section: 'A', row: 'A1', number: '5' }
      }
    });
  }
  
  if (isSampleTicket) {
    return res.status(200).json({
      success: true,
      message: 'Xác thực vé thành công',
      ticket: {
        id: `ticket-${Date.now()}`,
        event: {
          id: eventId,
          title: 'Sự kiện mẫu',
          date: new Date().toISOString()
        },
        user: {
          id: 'user123',
          name: 'Người dùng mẫu',
          email: 'user@example.com',
          avatar: '/images/placeholder-avatar.svg'
        },
        seat: {
          section: 'A',
          row: 'A1',
          number: '5'
        },
        ticketType: 'VIP',
        price: 100000,
        purchaseDate: new Date().toISOString()
      }
    });
  }
  
  return res.status(404).json({
    success: false,
    message: 'Vé không hợp lệ hoặc không tồn tại'
  });
});

// Thêm endpoint không cần auth cho debug
// @route   GET /api/tickets/public/debug/stats/:eventId
// @desc    Public debug endpoint for ticket check-in statistics (returns mock data)
// @access  Public (for testing only)
router.get('/public/debug/stats/:eventId', (req, res) => {
  // Dữ liệu mẫu cho việc kiểm thử
  const { eventId } = req.params;
  console.log('🔢 PUBLIC DEBUG STATS API ĐƯỢC GỌI cho sự kiện:', eventId);
  
  const mockStats = {
    total: 100,
    used: 65,
    unused: 30,
    cancelled: 3,
    returned: 2,
    checkInsByHour: [
      { date: '2025-06-30', hour: 9, count: 8 },
      { date: '2025-06-30', hour: 10, count: 12 },
      { date: '2025-06-30', hour: 11, count: 15 },
      { date: '2025-06-30', hour: 12, count: 10 },
      { date: '2025-06-30', hour: 13, count: 20 }
    ]
  };
  
  res.status(200).json({
    success: true,
    stats: mockStats
  });
});

// @route   POST /api/tickets/public/debug/verify
// @desc    Public debug endpoint for verifying tickets (returns mock data)
// @access  Public (for testing only)
router.post('/public/debug/verify', (req, res) => {
  const { qrCode, eventId } = req.body;
  console.log('🔍 PUBLIC DEBUG VERIFY API ĐƯỢC GỌI:', qrCode, eventId);
  
  // Kiểm tra qrCode có phải là mã vé mẫu của test không
  const isSampleTicket = qrCode && (
    qrCode.includes(`EVENT-${eventId}-TICKET`) ||
    qrCode.includes(`TICKET-${eventId}`) ||
    qrCode.includes(`eventId=${eventId}`) ||
    qrCode.includes(`event=${eventId}`) ||
    qrCode.includes(`id=${eventId}`)
  );
  
  const isAlreadyUsed = qrCode && qrCode.includes('-used');
  
  if (!qrCode) {
    return res.status(400).json({ 
      success: false, 
      message: 'Mã QR không được cung cấp' 
    });
  }

  console.log('Đang kiểm tra mã QR:', qrCode);
  console.log('Là vé mẫu?', isSampleTicket);
  console.log('Đã sử dụng?', isAlreadyUsed);
  
  if (isAlreadyUsed) {
    return res.status(400).json({
      success: false,
      message: 'Vé này đã được sử dụng',
      usedAt: new Date(),
      ticket: {
        id: `ticket-${Date.now()}`,
        event: { title: 'Sự kiện mẫu', id: eventId },
        user: { name: 'Người dùng mẫu', email: 'user@example.com' },
        seat: { section: 'A', row: 'A1', number: '5' }
      }
    });
  }
  
  // Chấp nhận mọi QR code có thông tin chuỗi
  if (qrCode && qrCode.length > 5) {
    return res.status(200).json({
      success: true,
      message: 'Xác thực vé thành công',
      ticket: {
        id: `ticket-${Date.now()}`,
        event: {
          id: eventId,
          title: 'Sự kiện mẫu',
          date: new Date().toISOString()
        },
        user: {
          id: 'user123',
          name: 'Người dùng mẫu',
          email: 'user@example.com',
          avatar: '/images/placeholder-avatar.svg'
        },
        seat: {
          section: 'A',
          row: 'A1',
          number: '5'
        },
        ticketType: 'VIP',
        price: 100000,
        purchaseDate: new Date().toISOString()
      }
    });
  }
  
  return res.status(404).json({
    success: false,
    message: 'Vé không hợp lệ hoặc không tồn tại'
  });
});

// Route công khai cho debug QR scan không cần auth
// @route   POST /api/tickets/public-verify
// @desc    Public endpoint for verifying any QR code (testing only)
// @access  Public
router.post('/public-verify', (req, res) => {
  const { qrCode, eventId } = req.body;
  console.log('🔍 PUBLIC VERIFY API ĐƯỢC GỌI:', qrCode, eventId);
  
  if (!qrCode) {
    return res.status(400).json({ 
      success: false, 
      message: 'Mã QR không được cung cấp' 
    });
  }
  
  // Always return success for any QR code
  return res.status(200).json({
    success: true,
    message: 'Xác thực vé thành công',
    ticket: {
      id: `ticket-${Date.now()}`,
      event: {
        id: eventId || 'unknown',
        title: 'Sự kiện mẫu',
        date: new Date().toISOString()
      },
      user: {
        id: 'user123',
        name: 'Người dùng mẫu',
        email: 'user@example.com',
        avatar: '/images/placeholder-avatar.svg'
      },
      seat: {
        section: 'A',
        row: 'A1',
        number: '5'
      },
      ticketType: 'VIP',
      price: 100000,
      purchaseDate: new Date().toISOString(),
      qrCode: qrCode
    }
  });
});

module.exports = router;