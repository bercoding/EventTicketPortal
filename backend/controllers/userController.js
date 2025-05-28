const User = require('../models/User');
const asyncHandler = require('express-async-handler'); // Để xử lý lỗi async
const fs = require('fs');
const path = require('path');

// @desc    Lấy thông tin profile của người dùng hiện tại
// @route   GET /api/users/profile/me
// @access  Private
const getCurrentUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password'); // req.user.id từ middleware 'protect'

    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            bio: user.bio,
            avatar: user.avatar ? `${req.protocol}://${req.get('host')}/uploads/avatars/${user.avatar}` : null,
            dateOfBirth: user.dateOfBirth,
            phoneNumber: user.phoneNumber,
            role: user.role,
            createdAt: user.createdAt
            // Thêm các trường khác nếu cần
        });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy người dùng.');
    }
});

// @desc    Cập nhật thông tin profile người dùng
// @route   PUT /api/users/profile/me
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (user) {
        user.fullName = req.body.fullName || user.fullName;
        user.bio = req.body.bio || user.bio;
        user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
        
        if (req.body.dateOfBirth) {
            // Validate dateOfBirth if necessary, e.g., ensure it's a valid date format
            // For now, we assume it's a valid date string or null
            user.dateOfBirth = req.body.dateOfBirth;
        }

        // Xử lý thay đổi username (cần kiểm tra duy nhất)
        if (req.body.username && req.body.username !== user.username) {
            const existingUser = await User.findOne({ username: req.body.username });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                res.status(400);
                throw new Error('Tên người dùng đã tồn tại.');
            }
            user.username = req.body.username;
        }

        // Xử lý thay đổi email (tạm thời không cho phép hoặc cần xác thực lại)
        // if (req.body.email && req.body.email !== user.email) {
        //     // Cần kiểm tra duy nhất và có thể yêu cầu xác thực email mới
        //     const existingEmail = await User.findOne({ email: req.body.email });
        //     if (existingEmail && existingEmail._id.toString() !== user._id.toString()) {
        //         res.status(400);
        //         throw new Error('Email đã tồn tại.');
        //     }
        //     user.email = req.body.email;
        //     // user.isEmailVerified = false; // Nếu có trường này
        // }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            bio: updatedUser.bio,
            avatar: updatedUser.avatar ? `${req.protocol}://${req.get('host')}/uploads/avatars/${updatedUser.avatar}` : null,
            dateOfBirth: updatedUser.dateOfBirth,
            phoneNumber: updatedUser.phoneNumber,
            role: updatedUser.role,
            // Trả về token mới nếu cần, hoặc client giữ token cũ
        });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy người dùng.');
    }
});

// @desc    Cập nhật avatar người dùng
// @route   PUT /api/users/profile/avatar
// @access  Private
const updateUserAvatar = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        res.status(404);
        throw new Error('Không tìm thấy người dùng.');
    }

    if (!req.file) {
        res.status(400);
        throw new Error('Vui lòng chọn một file ảnh để tải lên.');
    }

    // Xóa avatar cũ nếu có và không phải là avatar mặc định
    if (user.avatar) {
        const oldAvatarPath = path.join(__dirname, '../public/uploads/avatars', user.avatar);
        // Kiểm tra file tồn tại trước khi xóa để tránh lỗi
        if (fs.existsSync(oldAvatarPath)) {
            try {
                fs.unlinkSync(oldAvatarPath);
                console.log('Đã xóa avatar cũ:', oldAvatarPath);
            } catch (err) {
                console.error('Lỗi khi xóa avatar cũ:', err);
                // Không cần throw error ở đây, tiếp tục cập nhật avatar mới
            }
        } else {
            console.log('Không tìm thấy avatar cũ để xóa:', oldAvatarPath);
        }
    }

    user.avatar = req.file.filename; // Lưu tên file mới
    const updatedUser = await user.save();

    res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar ? `${req.protocol}://${req.get('host')}/uploads/avatars/${updatedUser.avatar}` : null, // Trả về URL đầy đủ của avatar mới
        dateOfBirth: updatedUser.dateOfBirth,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
        message: 'Cập nhật ảnh đại diện thành công.'
    });
});

module.exports = { getCurrentUserProfile, updateUserProfile, updateUserAvatar }; 