const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize, requireAdmin } = require('../middleware/auth');
const Event = require('../models/Event');

// Apply authentication to all routes
router.use(protect);
router.use(authorize('admin'));

// Debug route để kiểm tra kết nối và Events collection
router.get('/debug/events', adminController.getDebugEvents);

// Thêm public debug API không cần auth
router.get('/public/debug/events', async (req, res) => {
  try {
    console.log('🔍 PUBLIC DEBUG: Cung cấp danh sách sự kiện mẫu');
    
    const mockEvents = [
      {
        id: '685ab48cbd98a1cf388b61ae',
        title: '111111',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'upcoming'
      },
      {
        id: '685ab765bd98a1cf388b6322',
        title: '111',
        startDate: new Date(),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'upcoming'
      },
      {
        id: '685b54cbae2998b5b694d287',
        title: 'Concert Nhạc 2025',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'upcoming'
      },
      {
        id: '685b589c56c91bcc1eede28d',
        title: 'Rap Việt 2025',
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'upcoming'
      },
      {
        id: '685b6ebc51efa980bf282fc5',
        title: 'Lễ hội âm nhạc mùa hè 2025',
        startDate: new Date(),
        endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        status: 'upcoming'
      }
    ];
    
    return res.json({
      success: true,
      events: mockEvents
    });
  } catch (error) {
    console.error('❌ PUBLIC DEBUG ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Error providing sample events',
      error: error.message
    });
  }
});

// Dashboard stats
router.get('/dashboard/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getUsers);
router.post('/users/:id/ban', adminController.banUser);
router.post('/users/:id/unban', adminController.unbanUser);

// Event management
router.get('/events', adminController.getAllEvents);
router.post('/events/:id/approve', adminController.approveEvent);
router.post('/events/:id/reject', adminController.rejectEvent);

// Complaint management
router.get('/complaints', adminController.getComplaints);
router.post('/complaints/:id/resolve', adminController.resolveComplaint);

// Post management
router.get('/posts', adminController.getPosts);
router.post('/posts/:id/moderate', adminController.moderatePost);
router.delete('/posts/:id', adminController.deletePost);

// Violation reports
router.get('/violation-reports', adminController.getViolationReports);
router.post('/violation-reports/:id/resolve', adminController.resolveViolationReport);

// Revenue
router.get('/revenue', adminController.getRevenue);

// Owner requests
router.get('/owner-requests', adminController.getOwnerRequests);
router.post('/owner-requests/:id/approve', adminController.approveOwnerRequest);
router.post('/owner-requests/:id/reject', adminController.rejectOwnerRequest);

module.exports = router;