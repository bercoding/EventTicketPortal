const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        // Không nên unique nếu người dùng có thể yêu cầu OTP nhiều lần cho cùng 1 email (ví dụ quên OTP cũ)
        // Thay vào đó, khi xác thực, sẽ tìm OTP mới nhất và chưa xác thực cho email đó.
        // Hoặc, khi tạo OTP mới, xóa các OTP cũ chưa xác thực của email đó.
    },
    username: { // Lưu username để khi hoàn tất đăng ký không cần hỏi lại hoặc truyền qua nhiều bước
        type: String,
        required: true 
    },
    otpCode: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        // index: { expires: '10m' } // MongoDB sẽ tự động xóa document sau 10 phút, nhưng chúng ta sẽ quản lý thủ công
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    userData: {
        type: Object,
        default: null,
        // Lưu thông tin người dùng để tạo sau khi xác thực OTP
        // Ví dụ: { fullName, email, username, password (đã hash) }
    }
}, { timestamps: true }); // createdAt sẽ cho biết OTP được tạo khi nào

// Xóa các OTP cũ cho cùng email khi tạo OTP mới để đảm bảo chỉ có 1 OTP hợp lệ tại 1 thời điểm
otpSchema.pre('save', async function(next) {
    if (this.isNew) {
        // 'this.constructor' tham chiếu đến model Otp
        await this.constructor.deleteMany({ email: this.email, isVerified: false });
    }
    next();
});

const Otp = mongoose.model('Otp', otpSchema);


module.exports = Otp; 

