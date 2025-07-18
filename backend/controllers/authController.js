// backend/controllers/authController.js
const User = require('../models/User');
const Otp = require('../models/Otp');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../config/email');

// Tạo token JWT
const generateToken = (id) => {
    console.log(`Generating token for user ID: ${id}`);
    // Tăng thời gian hết hạn lên 7 ngày để tránh logout quá nhanh
    const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log(`Token generated with expiry: 7 days`);
    return token;
};

// Tạo OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Đăng ký
exports.register = async (req, res) => {
    const { username, email, password, fullName } = req.body;
    
    try {
        // Kiểm tra user đã tồn tại
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        
        if (userExists) {
            return res.status(400).json({ 
                success: false,
                message: 'Email hoặc tên đăng nhập đã tồn tại' 
            });
        }

        // Hash password trước khi lưu vào OTP record
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo OTP
        const otpCode = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

        // Lưu OTP và thông tin đăng ký vào database
        const otpRecord = await Otp.create({
            email,
            username,
            otpCode,
            expiresAt: otpExpiry,
            userData: {       // Lưu thông tin user để tạo sau khi xác thực
                fullName,
                email, 
                username,
                password: hashedPassword
            }
        });

        // Gửi email OTP
        const emailContent = `
            <h2>Xác thực tài khoản của bạn</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại Event Ticket Portal.</p>
            <p>Mã OTP của bạn là: <strong>${otpCode}</strong></p>
            <p>Mã này sẽ hết hạn sau 10 phút.</p>
            <p>Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        `;

        await sendEmail({
            email,
            subject: 'Xác thực tài khoản Event Ticket Portal',
            message: emailContent
        });
        
        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP.',
            email: email // Trả về email để sử dụng khi xác thực OTP
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(400).json({ 
            success: false,
            message: 'Đăng ký thất bại',
            error: error.message 
        });
    }
};

// Xác thực OTP
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        // Tìm OTP mới nhất và chưa xác thực của email
        const otpRecord = await Otp.findOne({
            email,
            otpCode: otp,
            isVerified: false,
            expiresAt: { $gt: Date.now() }
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không hợp lệ hoặc đã hết hạn'
            });
        }

        // Tạo user mới từ thông tin đã lưu trong OTP record
        const userData = otpRecord.userData;
        
        // Kiểm tra xem người dùng đã được tạo chưa
        let user = await User.findOne({ email: otpRecord.email });
        
        if (!user) {
            // Tạo user mới nếu chưa tồn tại
            user = await User.create({
                username: userData.username,
                email: userData.email,
                password: userData.password, // Đã được hash từ trước
                fullName: userData.fullName,
                status: 'active',
                isVerified: true
            });
        } else {
            // Cập nhật trạng thái nếu user đã tồn tại
            user.status = 'active';
            user.isVerified = true;
            await user.save();
        }

        // Cập nhật trạng thái OTP
        otpRecord.isVerified = true;
        await otpRecord.save();

        // Tạo token và trả về thông tin user
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Xác thực thành công',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Xác thực thất bại',
            error: error.message
        });
    }
};

// Gửi lại OTP
exports.resendOTP = async (req, res) => {
    const { email } = req.body;

    try {
        // Tìm OTP gần nhất cho email này
        const lastOtp = await Otp.findOne({ 
            email,
            isVerified: false
        }).sort({ createdAt: -1 });

        if (!lastOtp) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin đăng ký cần xác thực'
            });
        }

        // Lấy thông tin người dùng từ OTP trước đó
        const userData = lastOtp.userData;

        // Tạo OTP mới
        const otpCode = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

        // Xóa OTP cũ và tạo mới
        await Otp.deleteMany({ email, isVerified: false });
        await Otp.create({
            email,
            username: lastOtp.username,
            otpCode,
            expiresAt: otpExpiry,
            userData: userData // Giữ lại thông tin người dùng đã đăng ký
        });

        // Gửi email OTP
        const emailContent = `
            <h2>Xác thực tài khoản của bạn</h2>
            <p>Mã OTP mới của bạn là: <strong>${otpCode}</strong></p>
            <p>Mã này sẽ hết hạn sau 10 phút.</p>
            <p>Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        `;

        await sendEmail({
            email,
            subject: 'Mã OTP mới - Event Ticket Portal',
            message: emailContent
        });

        res.status(200).json({
            success: true,
            message: 'Mã OTP mới đã được gửi đến email của bạn'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Không thể gửi lại mã OTP',
            error: error.message
        });
    }
};

// Đăng nhập
exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        console.log('🔐 Login attempt for email:', email);
        
        // Kiểm tra email và password
        if (!email || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({ 
                success: false,
                message: 'Vui lòng nhập email và mật khẩu' 
            });
        }
        
        // Tìm user
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('❌ User not found for email:', email);
            return res.status(401).json({ 
                success: false,
                message: 'Email hoặc mật khẩu không đúng' 
            });
        }

        console.log('👤 Found user:', user.email, 'ID:', user._id);

        // Kiểm tra trạng thái tài khoản
        if (user.status === 'pending') {
            console.log('⏳ User account pending verification:', user.email);
            return res.status(403).json({
                success: false,
                message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực.'
            });
        }
        
        // Kiểm tra user có bị ban không
        if (user.isBanned) {
            console.log('🚫 User is banned:', user.email);
            return res.status(403).json({ 
                success: false,
                message: 'Tài khoản của bạn đã bị khóa',
                banned: true,
                banReason: user.banReason || 'Vi phạm điều khoản sử dụng'
            });
        }
        
        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            console.log('❌ Password mismatch for user:', user.email);
            return res.status(401).json({ 
                success: false,
                message: 'Email hoặc mật khẩu không đúng' 
            });
        }
        
        // Cập nhật thời gian đăng nhập
        user.lastLoginAt = Date.now();
        await user.save();
        
        // Tạo token
        const token = generateToken(user._id);
        
        console.log('✅ Login successful for user:', user.email, 'ID:', user._id);
        console.log('🔑 Generated token for user ID:', user._id);
        
        // Prepare user data to return (exclude sensitive fields)
        const userData = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            ownerRequestStatus: user.ownerRequestStatus,
            fullName: user.fullName
        };
        
        console.log('📤 Returning user data:', userData);
        
        res.status(200).json({
            success: true,
            token,
            user: userData
        });
    } catch (error) {
        console.error('❌ Login error:', error);
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
        console.log('🔍 getMe called for user ID:', req.user?.id);
        
        if (!req.user || !req.user.id) {
            console.log('❌ getMe: No user in request');
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy thông tin xác thực'
            });
        }
        
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            console.log('❌ getMe: User not found in database for ID:', req.user.id);
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        console.log('✅ getMe: User found:', user.email);
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('❌ getMe error:', error);
        res.status(400).json({ 
            success: false,
            message: 'Không thể lấy thông tin người dùng',
            error: error.message 
        });
    }
};

// Quên mật khẩu - Gửi OTP
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'Email không tồn tại trong hệ thống' 
            });
        }

        // Tạo OTP 6 số
        const otpCode = generateOTP();
        
        // Lưu OTP vào user (hoặc có thể dùng OTP model riêng)
        user.resetPasswordOTP = otpCode;
        user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 phút

        await user.save();

        // Gửi email với OTP
        const message = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🔐 Đặt lại mật khẩu</h2>
                    
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">Xin chào <strong>${user.fullName || user.username}</strong>,</p>
                    
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Event Ticket Portal. 
                        Vui lòng sử dụng mã OTP sau để xác nhận:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="background-color: #007bff; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">
                            ${otpCode}
                        </div>
                    </div>
                    
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        <strong>Lưu ý quan trọng:</strong>
                    </p>
                    <ul style="color: #555; font-size: 14px; line-height: 1.6;">
                        <li>Mã OTP này có hiệu lực trong <strong>10 phút</strong></li>
                        <li>Không chia sẻ mã OTP với bất kỳ ai</li>
                        <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                    </ul>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        Email này được gửi từ Event Ticket Portal<br>
                        Nếu có thắc mắc, vui lòng liên hệ hỗ trợ
                    </p>
                </div>
            </div>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: '🔐 Mã OTP đặt lại mật khẩu - Event Ticket Portal',
                message
            });

            console.log(`📧 OTP sent to ${email}: ${otpCode}`); // Log để debug

            res.status(200).json({ 
                success: true, 
                message: 'Mã OTP đã được gửi đến email của bạn',
                // Trong development có thể trả về OTP để test
                ...(process.env.NODE_ENV === 'development' && { otp: otpCode })
            });
        } catch (error) {
            user.resetPasswordOTP = undefined;
            user.resetPasswordOTPExpires = undefined;
            await user.save();

            console.error('Email sending error:', error);

            return res.status(500).json({ 
                success: false,
                message: 'Không thể gửi email OTP' 
            });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Lỗi quên mật khẩu',
            error: error.message 
        });
    }
};

// Xác thực OTP
exports.verifyResetOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        // Tìm user với OTP hợp lệ
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordOTPExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Mã OTP không hợp lệ hoặc đã hết hạn' 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'OTP hợp lệ. Bạn có thể đặt lại mật khẩu.',
            data: { email }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Lỗi xác thực OTP',
            error: error.message 
        });
    }
};

// Đặt lại mật khẩu với OTP
exports.resetPasswordWithOTP = async (req, res) => {
    const { email, otp, password } = req.body;

    try {
        // Tìm user với OTP hợp lệ
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordOTPExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Mã OTP không hợp lệ hoặc đã hết hạn' 
            });
        }

        // Đặt mật khẩu mới (sẽ được hash tự động bởi User schema middleware)
        user.password = password;
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpires = undefined;
        await user.save();

        console.log(`✅ Password reset successfully for ${email}`);

        res.status(200).json({ 
            success: true, 
            message: 'Đặt lại mật khẩu thành công' 
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Lỗi đặt lại mật khẩu',
            error: error.message 
        });
    }
};

// Đặt lại mật khẩu (legacy - với token)
exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;

    try {
        // Hash token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Tìm user với token hợp lệ
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn' 
            });
        }

        // Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ 
            success: true, 
            message: 'Đặt lại mật khẩu thành công' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Lỗi đặt lại mật khẩu',
            error: error.message 
        });
    }
};