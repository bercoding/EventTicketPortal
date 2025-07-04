// backend/config/db.js
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // Fix mongoose deprecation warning
        mongoose.set('strictQuery', false);
        
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            autoIndex: true,
            serverSelectionTimeoutMS: 30000, // Timeout sau 30 giây
            socketTimeoutMS: 45000, // Socket timeout
            connectTimeoutMS: 30000, // Kết nối timeout
            retryWrites: true,
            retryReads: true
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;