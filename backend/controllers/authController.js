// backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Tạo token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Đăng ký
exports.register = async (req, res) => {
    const { username, email, password, role } = req.body;
    
    try {
        // Kiểm tra user đã tồn tại
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        
        if (userExists) {
            return res.status(400).json({ message: 'Người dùng đã tồn tại' });
        }
        
        // Tạo user mới
        const user = await User.create({
            username,
            email,
            password,
            role: role || 'user'
        });
        
        // Trả về token
        const token = generateToken(user._id);
        
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: 'Đăng ký thất bại',
            error: error.message 
        });
    }
};

// Đăng nhập
exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        console.log('Login attempt:', { email, password: '***' });
        
        // Kiểm tra email và password
        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
        }
        
        // Tìm user
        const user = await User.findOne({ email });
        console.log('User found:', !!user);
        
        if (!user) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
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
        
        // Kiểm tra mật khẩu
        const isMatch = await user.comparePassword(password);
        console.log('Password match:', isMatch);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }
        
        // Trả về token
        const token = generateToken(user._id);
        
        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(400).json({ 
            success: false,
            message: 'Đăng nhập thất bại',
            error: error.message 
        });
    }
};

// Lấy thông tin người dùng hiện tại
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: 'Không thể lấy thông tin người dùng',
            error: error.message 
        });
    }
};