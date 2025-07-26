const Notification = require('../models/Notification');
const asyncHandler = require('express-async-handler');

// @desc    Lấy danh sách thông báo của người dùng
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20); // Giới hạn 20 thông báo gần nhất

  const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

  res.json({
    notifications,
    unreadCount,
  });
});

// @desc    Đánh dấu một thông báo là đã đọc
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (notification) {
    res.json(notification);
  } else {
    res.status(404);
    throw new Error('Thông báo không tồn tại hoặc bạn không có quyền truy cập');
  }
});

// @desc    Đánh dấu tất cả thông báo là đã đọc
// @route   PUT /api/notifications/mark-all-as-read
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true }
  );

  res.json({ message: 'Tất cả thông báo đã được đánh dấu là đã đọc' });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
}; 