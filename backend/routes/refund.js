const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');
const { protect, authorize } = require('../middleware/auth');

// Tạo yêu cầu hoàn tiền
router.post('/requests', protect, refundController.createRefundRequest);

// Lấy danh sách yêu cầu hoàn tiền của người dùng
router.get('/user-requests', protect, refundController.getUserRefundRequests);

// [ADMIN] Lấy tất cả yêu cầu hoàn tiền
router.get('/admin/requests', protect, authorize('admin'), refundController.getAllRefundRequests);

// [ADMIN] Xử lý yêu cầu hoàn tiền (chấp nhận/từ chối/đánh dấu đã thanh toán)
router.put('/admin/requests/:id', protect, authorize('admin'), refundController.processRefundRequest);

module.exports = router; 