// backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../config/email'); // Import hàm sendEmail

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

// Quên mật khẩu - Yêu cầu OTP
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    console.log('--- Forgot Password Attempt ---');
    console.log('Requesting OTP for email:', email);

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(404).json({ success: false, message: 'Email không tồn tại trong hệ thống.' });
        }
        console.log('User found, ID:', user._id);

        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // OTP hết hạn sau 10 phút
        console.log('Generated OTP:', otp, 'Expires at:', new Date(otpExpires).toISOString());

        user.otp = otp;
        user.otpExpires = otpExpires;
        
        console.log('Attempting to save OTP to DB for user:', user._id);
        try {
            await user.save(); // Lưu thông tin OTP MỚI vào database
            console.log('OTP saved to DB successfully for user:', user._id);

            // Lấy lại user từ DB để kiểm tra xem OTP đã được lưu chưa
            const userAfterSave = await User.findById(user._id);
            console.log('User details after save (from DB):', { 
                otpInDB: userAfterSave.otp, 
                otpExpiresInDB: userAfterSave.otpExpires 
            });

        } catch (saveError) {
            console.error('ERROR SAVING OTP TO DB for user:', user._id, saveError);
            // Nếu lỗi lưu, vẫn nên thử xóa OTP để tránh gửi mail mà OTP không hợp lệ
            user.otp = undefined;
            user.otpExpires = undefined;
            // Không cần await save() ở đây nữa vì đã lỗi rồi
            return res.status(500).json({ success: false, message: 'Lỗi khi lưu OTP. Vui lòng thử lại.' });
        }

        // Gửi email
        const emailSubject = 'Yêu cầu đặt lại mật khẩu';
        const emailHtml = `
            <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <h1 style="font-size: 24px; color: #0056b3; margin: 0;">${process.env.APP_NAME || 'Ứng Dụng Của Bạn'}</h1>
                    </div>
                    <h2 style="font-size: 20px; color: #0056b3; margin-bottom: 20px;">Yêu Cầu Đặt Lại Mật Khẩu</h2>
                    <p style="margin-bottom: 15px;">Xin chào,</p>
                    <p style="margin-bottom: 15px;">Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn được liên kết với địa chỉ email này.</p>
                    <p style="margin-bottom: 15px;">Vui lòng sử dụng mã OTP (Mã xác thực một lần) dưới đây để tiếp tục quá trình đặt lại mật khẩu. Mã này sẽ có hiệu lực trong <strong>10 phút</strong>.</p>
                    <div style="background-color: #e9ecef; text-align: center; padding: 15px; border-radius: 5px; margin: 25px 0;">
                        <p style="font-size: 28px; font-weight: bold; color: #004085; letter-spacing: 2px; margin: 0;">${otp}</p>
                    </div>
                    <p style="margin-bottom: 15px;">Để bảo vệ tài khoản của bạn, vui lòng không chia sẻ mã OTP này với bất kỳ ai.</p>
                    <p style="margin-bottom: 20px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Không có thay đổi nào được thực hiện đối với tài khoản của bạn.</p>
                    <hr style="border: none; border-top: 1px solid #dddddd; margin: 25px 0;">
                    <p style="margin-bottom: 5px;">Trân trọng,</p>
                    <p style="font-weight: bold; color: #0056b3; margin-bottom: 15px;">Đội ngũ ${process.env.APP_NAME || 'Ứng Dụng Của Bạn'}</p>
                    <div style="text-align: center; font-size: 0.9em; color: #777777; margin-top: 20px;">
                        <p>Đây là một email tự động. Vui lòng không trả lời thư này.</p>
                    </div>
                </div>
            </div>
        `;

        await sendEmail(user.email, emailSubject, emailHtml);

        res.status(200).json({ success: true, message: 'OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.' });

    } catch (error) {
        console.error('Forgot Password Error (Outer Catch):', error);
        // Xóa OTP nếu có lỗi để tránh tình trạng OTP còn lại mà không gửi được mail
        // Cần kiểm tra xem user có tồn tại không trước khi cố gắng truy cập các thuộc tính của nó
        if (req.body.email) { // Kiểm tra email từ request body
            try {
                const userToClean = await User.findOne({ email: req.body.email });
                if (userToClean) {
                    userToClean.otp = undefined;
                    userToClean.otpExpires = undefined;
                    await userToClean.save();
                    console.log('OTP cleaned up for user due to outer catch error:', req.body.email);
                }
            } catch (cleanupError) {
                console.error('Error during OTP cleanup in outer catch:', cleanupError);
            }
        }
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xử lý yêu cầu. Vui lòng thử lại sau.' });
    }
};

// Xác thực OTP
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    console.log('--- Verify OTP Attempt ---'); // Log bắt đầu
    console.log('Received from Frontend:', { email, otpReceived: otp });

    if (!email || !otp) { 
        console.log('Validation Error: Email or OTP missing.');
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và OTP.' });
    }

    try {
        const userInDB = await User.findOne({ email }); // Tìm user chỉ bằng email trước

        if (!userInDB) {
            console.log('User not found in DB for email:', email);
            return res.status(400).json({ success: false, message: 'Email không tồn tại hoặc OTP không hợp lệ.' });
        }

        console.log('User found in DB. Stored OTP details:', { 
            storedOtp: userInDB.otp, 
            storedOtpExpires: userInDB.otpExpires,
            isExpired: userInDB.otpExpires ? (userInDB.otpExpires.getTime() < Date.now()) : 'N/A'
        });

        // Bây giờ mới thực hiện query đầy đủ để so sánh OTP và thời gian hết hạn
        const matchedUser = await User.findOne({ 
            email, 
            otp, // So sánh trực tiếp OTP người dùng nhập với OTP trong database
            otpExpires: { $gt: Date.now() } 
        });

        if (!matchedUser) { 
            console.log('OTP Mismatch or Expired. Query for exact match failed.');
            console.log('Query details:', { email, otpToMatch: otp, expiryCondition: { $gt: Date.now() } });
            return res.status(400).json({ success: false, message: 'OTP không hợp lệ hoặc đã hết hạn.' });
        }
        
        console.log('OTP Verified Successfully for user:', matchedUser._id);
        res.status(200).json({ success: true, message: 'Xác thực OTP thành công. Bạn có thể đặt lại mật khẩu.' });

    } catch (error) {
        console.error('Verify OTP Server Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xác thực OTP.' });
    }
};

// Đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email, OTP và mật khẩu mới.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    try {
        const user = await User.findOne({
            email,
            otp, // Kiểm tra lại OTP một lần nữa để chắc chắn
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Yêu cầu không hợp lệ hoặc OTP đã hết hạn. Vui lòng thử lại quá trình quên mật khẩu.' });
        }

        // Hash mật khẩu mới và cập nhật
        user.password = newPassword; // Middleware pre('save') sẽ tự động hash mật khẩu
        user.otp = undefined; // Xóa OTP
        user.otpExpires = undefined; // Xóa thời gian hết hạn OTP
        await user.save();

        res.status(200).json({ success: true, message: 'Mật khẩu của bạn đã được đặt lại thành công.' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đặt lại mật khẩu.' });
    }
};