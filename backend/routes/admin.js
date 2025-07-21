const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize, requireAdmin } = require('../middleware/auth');
const Event = require('../models/Event');
const Complaint = require('../models/Complaint');

// Endpoint khiếu nại ban - không yêu cầu xác thực
router.post('/complaints/appeal', async (req, res) => {
  try {
    const { reason, type, userId } = req.body;
    
    // Lấy thông tin user từ token nếu có
    const user = req.user ? req.user._id : (userId || null);
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lý do khiếu nại'
      });
    }

    // Tạo khiếu nại mới với các trường bắt buộc
    const complaint = new Complaint({
      user: user || '64ff7978d0bdf7ed717156fb', // User ID mặc định nếu không có
      subject: 'Kháng cáo tài khoản bị ban',
      description: reason,
      category: 'user_behavior', // Đảm bảo khớp với enum trong model
      priority: 'high',
      status: 'pending'
    });

    await complaint.save();
    
    console.log('✅ Khiếu nại ban đã được tạo:', complaint._id);
    
    return res.status(201).json({
      success: true,
      message: 'Khiếu nại đã được gửi thành công',
      complaint: {
        id: complaint._id,
        createdAt: complaint.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Lỗi khi gửi khiếu nại ban:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi gửi khiếu nại',
      error: error.message
    });
  }
});

// Apply authentication to all routes below this point
router.use(protect);
router.use(authorize('admin'));

// Debug route để kiểm tra kết nối và Events collection
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
router.get('/events', adminController.getEvents);
router.post('/events/:eventId/approve', adminController.approveEvent);
router.post('/events/:eventId/reject', adminController.rejectEvent);

// Complaint management
router.get('/complaints', adminController.getComplaints);
router.post('/complaints/:id/resolve', adminController.resolveComplaint);

// Post management
router.get('/posts', adminController.getPosts);
router.post('/posts/:id/moderate', adminController.moderatePost);
router.delete('/posts/:id', adminController.deletePost);

// Violation reports
router.get('/violation-reports', adminController.getViolationReports);
router.post('/violation-reports/:id/resolve', adminController.resolveViolationReport)

// Revenue
router.get('/revenue', adminController.getRevenue);

// Owner requests
router.get('/owner-requests', adminController.getOwnerRequests);
router.post('/owner-requests/:id/approve', adminController.approveOwnerRequest);
router.post('/owner-requests/:id/reject', adminController.rejectOwnerRequest);

module.exports = router;