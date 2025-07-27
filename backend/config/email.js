const nodemailer = require('nodemailer');
require('dotenv').config(); // Đảm bảo bạn đã cài đặt dotenv và có file .env

// In ra thông tin cấu hình email khi khởi động (loại bỏ mật khẩu)
console.log('📧 Email Configuration:');
console.log('- EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('- EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('- EMAIL_SECURE:', process.env.EMAIL_SECURE);
console.log('- EMAIL_USER:', process.env.EMAIL_USER);
console.log('- EMAIL_FROM:', process.env.EMAIL_FROM || process.env.EMAIL_USER);

// Test kết nối email khi khởi động ứng dụng
const testEmailConnection = async () => {
  try {
    console.log('📧 Testing email connection...');
    
    const testTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });
    
    // Verify connection configuration
    const verify = await testTransporter.verify();
    console.log('✅ Email connection successful:', verify);
    return true;
  } catch (error) {
    console.error('❌ Email connection failed:', error.message);
    console.error('Error code:', error.code);
    return false;
  }
};

// Gọi hàm kiểm tra khi module được load
testEmailConnection();

// Cấu hình transporter với dịch vụ email của bạn
// Ví dụ này sử dụng SMTP, bạn có thể thay đổi tùy theo nhà cung cấp dịch vụ
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // Ví dụ: 'smtp.gmail.com'
  port: process.env.EMAIL_PORT, // Ví dụ: 587 (TLS) hoặc 465 (SSL)
  secure: process.env.EMAIL_SECURE === 'true', // true cho port 465, false cho các port khác
  auth: {
    user: process.env.EMAIL_USER, // Email của bạn
    pass: process.env.EMAIL_PASS, // Mật khẩu email hoặc App Password của bạn
  },
  // Thêm debug nếu NODE_ENV là development
  ...(process.env.NODE_ENV === 'development' && {
    debug: true,
    logger: true
  })
});

const sendEmail = async ({ email, subject, message }) => {
  try {
    console.log(`📧 Sending email to: ${email}`);
    console.log(`📧 Subject: ${subject}`);
    
    const mailOptions = {
      from: `"Event Ticket Portal" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: message,
    };

    console.log('📧 Preparing email transport...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:');
    console.log('- Message ID:', info.messageId);
    console.log('- Response:', info.response);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('- Error name:', error.name);
    console.error('- Error message:', error.message);
    console.error('- Error code:', error.code);
    if (error.code === 'EAUTH') {
      console.error('❌ Authentication error. Check your username and password.');
    } else if (error.code === 'ESOCKET') {
      console.error('❌ Socket error. Check your host, port and secure settings.');
    }
    throw error;
  }
};

module.exports = sendEmail; 