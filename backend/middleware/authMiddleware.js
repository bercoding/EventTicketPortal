const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Lấy token từ header (Bearer tokenString)
            token = req.headers.authorization.split(' ')[1];

            // Xác thực token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Lấy thông tin user từ token (không lấy password)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            if (req.user.isBanned) {
                return res.status(403).json({ 
                    message: 'Tài khoản của bạn đã bị khóa',
                    reason: req.user.banReason
                });
            }

            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Not authorized, token failed (invalid token)' });
            } else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Not authorized, token expired' });
            }
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
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