// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Vui lòng nhập họ tên'],
        trim: true
    },
    username: {
        type: String,
        required: [true, 'Vui lòng nhập tên người dùng'],
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: [true, 'Vui lòng nhập email'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // Password required only if not Google user
        },
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
    },
    phone: {
        type: String,
        trim: true
    },
    avatar: {
        type: String,
        default: null
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'other'
    },
    role: {
        type: String,
        enum: ['user', 'owner', 'admin', 'event_owner'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'banned', 'inactive'],
        default: 'active'
    },
    banReason: {
        type: String
    },
    banDate: {
        type: Date
    },
    banExpiry: {
        type: Date
    },
    lastLogin: {
        type: Date
    },
    loginCount: {
        type: Number,
        default: 0
    },
    googleId: {
        type: String,
        sparse: true
    },
    ownerRequestStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none'
    },
    ownerRequestDate: {
        type: Date
    },
    ownerRequestReason: {
        type: String
    },
    resetPasswordOTP: {
        type: String
    },
    resetPasswordOTPExpires: {
        type: Date
    }
}, { timestamps: true });

// Encrypt password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    
    if (this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;