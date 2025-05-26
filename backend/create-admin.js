const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Kiểm tra xem có admin nào chưa
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin đã tồn tại:', existingAdmin.username);
      process.exit(0);
    }

    // Tạo admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      fullName: 'Administrator',
      role: 'admin'
    });

    console.log('Admin user đã được tạo thành công!');
    console.log('Username: admin');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('Role:', adminUser.role);

  } catch (error) {
    console.error('Lỗi tạo admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin(); 