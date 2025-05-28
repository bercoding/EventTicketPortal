const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware'); // Giả sử bạn có middleware này để bảo vệ route
const { getCurrentUserProfile, updateUserProfile, updateUserAvatar } = require('../controllers/userController');
const { uploadAvatar } = require('../middleware/uploadMiddleware'); // Import middleware upload

// @desc    Search users
// @route   GET /api/users/search?q=searchTerm
// @access  Private (cần đăng nhập để tìm kiếm)
router.get('/search', protect, async (req, res) => {
    const searchTerm = req.query.q || '';

    if (!searchTerm.trim()) {
        return res.json([]); // Trả về mảng rỗng nếu searchTerm trống
    }

    try {
        // Tìm kiếm user theo username hoặc email, không phân biệt hoa thường
        // Chỉ trả về các trường cần thiết
        const users = await User.find({
            $or: [
                { username: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } }
            ]
        }).select('_id username email avatar'); 
        
        res.json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tìm kiếm người dùng.' });
    }
});

// @route   GET /api/users/profile/me
// @desc    Lấy thông tin profile của người dùng hiện tại
// @access  Private
router.get('/profile/me', protect, getCurrentUserProfile);

// @route   PUT /api/users/profile/me
// @desc    Cập nhật thông tin profile người dùng
// @access  Private
router.put('/profile/me', protect, updateUserProfile);

// @route   PUT /api/users/profile/avatar
// @desc    Cập nhật avatar người dùng
// @access  Private
router.put('/profile/avatar', protect, uploadAvatar.single('avatarFile'), updateUserAvatar);
// 'avatarFile' phải khớp với tên trường FormData gửi từ client

// (Tùy chọn) Có thể thêm các route khác liên quan đến user ở đây, ví dụ: GET /api/users/:id để lấy thông tin user cụ thể

module.exports = router; 