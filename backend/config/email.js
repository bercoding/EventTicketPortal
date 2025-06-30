const nodemailer = require('nodemailer');
require('dotenv').config(); // Đảm bảo bạn đã cài đặt dotenv và có file .env

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
  // tls: {
  //   rejectUnauthorized: false // Sử dụng nếu server SMTP có chứng chỉ tự ký (self-signed certificate)
  // }
});

const sendEmail = async ({ email, subject, message }) => {
  try {
    const mailOptions = {
      from: `"Event Ticket Portal" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: message,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = sendEmail; 