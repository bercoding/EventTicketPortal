const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Tạo token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Google Login
exports.googleAuth = async (req, res) => {
    const { token } = req.body;

    console.log('🔐 Google Auth attempt with token:', token ? 'provided' : 'missing');

    try {
        // Xác thực token với Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, name, picture } = payload;
        
        console.log('👤 Google user data:', { email, name });

        // Kiểm tra user đã tồn tại chưa
        let user = await User.findOne({ email });

        if (!user) {
            console.log('👤 Creating new user from Google auth');
            
            // Tạo username unique từ email
            const baseUsername = email.split('@')[0];
            let username = baseUsername;
            let counter = 1;
            
            // Kiểm tra username đã tồn tại chưa
            while (await User.findOne({ username })) {
                username = `${baseUsername}${counter}`;
                counter++;
            }
            
            console.log('📝 Generated unique username:', username);
            
            // Tạo user mới nếu chưa tồn tại
            user = await User.create({
                email,
                username,
                fullName: name || email.split('@')[0], // Sử dụng name từ Google hoặc fallback
                googleId: payload.sub,
                avatar: picture,
                isVerified: true // Email đã được xác thực bởi Google
            });
            
            console.log('✅ Created new user:', user.email, 'with fullName:', user.fullName);
        } else {
            console.log('👤 Found existing user, updating Google data');
            // Cập nhật thông tin Google nếu user đã tồn tại
            user.googleId = payload.sub;
            if (picture) user.avatar = picture;
            if (name && !user.fullName) user.fullName = name; // Cập nhật fullName nếu chưa có
            await user.save();
        }

        // Kiểm tra user có bị ban không
        if (user.isBanned) {
            console.log('❌ User is banned:', user.email);
            return res.status(403).json({
                success: false,
                message: 'Tài khoản của bạn đã bị khóa',
                banned: true,
                banReason: user.banReason || 'Vi phạm điều khoản sử dụng'
            });
        }

        // Tạo token JWT
        const jwtToken = generateToken(user._id);
        
        console.log('✅ Google login successful for user:', user.email, user._id);

        res.status(200).json({
            success: true,
            token: jwtToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(400).json({
            success: false,
            message: 'Đăng nhập bằng Google thất bại',
            error: error.message
        });
    }
}; 