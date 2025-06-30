const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Lấy token từ header (Bearer tokenString)
            token = req.headers.authorization.split(' ')[1];
            console.log('✅ Token found:', token.substring(0, 20) + '...');

            // Xác thực token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ Token decoded:', JSON.stringify(decoded, null, 2));

            // Lấy thông tin user từ token (không lấy password)
            req.user = await User.findById(decoded.id).select('-password');
            console.log('🔍 User found:', req.user ? req.user.email : 'null');

            if (!req.user) {
                console.log('❌ User not found in database');
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            if (req.user.isBanned) {
                console.log('❌ User is banned:', req.user.banReason);
                return res.status(403).json({ 
                    message: 'Tài khoản của bạn đã bị khóa',
                    reason: req.user.banReason
                });
            }

            console.log('✅ Authentication successful');
            next();
        } catch (error) {
            console.error('❌ Token verification failed:', error.message);
            console.error('Error details:', error);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Not authorized, token failed (invalid token)' });
            } else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Not authorized, token expired' });
            }
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        console.log('❌ No token provided in request');
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
    }

    next();
};

const isEventOwner = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập' });
    }

    if (req.user.role !== 'event_owner' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
    }

    next();
};

module.exports = { protect, admin, isAdmin, isEventOwner }; 