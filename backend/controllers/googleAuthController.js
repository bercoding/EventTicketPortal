const { client } = require('../config/google');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Tạo token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Google Login
exports.googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;

        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        console.log('Google payload:', { googleId, email, name, picture });

        // Kiểm tra user đã tồn tại chưa
        let user = await User.findOne({
            $or: [
                { email: email },
                { googleId: googleId }
            ]
        });

        if (user) {
            // User đã tồn tại, cập nhật thông tin Google nếu chưa có
            if (!user.googleId) {
                user.googleId = googleId;
                user.avatar = picture;
                await user.save();
            }

            // Kiểm tra user có bị ban không
            if (user.isBanned) {
                return res.status(403).json({
                    success: false,
                    message: 'Tài khoản của bạn đã bị khóa',
                    banned: true,
                    banReason: user.banReason || 'Vi phạm điều khoản sử dụng'
                });
            }
        } else {
            // Tạo user mới
            user = await User.create({
                email,
                fullName: name,
                username: email.split('@')[0] + '_' + Date.now(), // Tạo username unique
                googleId,
                avatar: picture,
                password: 'google_auth_' + Date.now(), // Password dummy
                role: 'user'
            });
        }

        // Cập nhật last login
        user.lastLoginAt = new Date();
        await user.save();

        // Tạo JWT token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                avatar: user.avatar,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Google auth error:', error);
        res.status(400).json({
            success: false,
            message: 'Đăng nhập Google thất bại',
            error: error.message
        });
    }
}; 