const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Không có quyền truy cập, vui lòng đăng nhập' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Người dùng không tồn tại' });
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
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token không hợp lệ' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Người dùng với vai trò ${req.user.role} không có quyền truy cập`
            });
        }
        next();
    };
};

// Alias for protect function
exports.authenticateToken = exports.protect;

// Admin authorization middleware
exports.requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
}; 