// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Tên đăng nhập là bắt buộc'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    password: {
        type: String,
        required: [true, 'Mật khẩu là bắt buộc'],
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
    },
    fullName: {
        type: String,
        trim: true
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    avatar: String,
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'Tiểu sử không được vượt quá 500 ký tự']
    },
    dateOfBirth: {
        type: Date
    },
    role: {
        type: String,
        enum: ['user', 'event_owner', 'admin'],
        default: 'user',
        index: true
    },
    googleId: String,
    status: {
        type: String,
        enum: ['active', 'blocked', 'pending'],
        default: 'active',
        index: true
    },
    // Admin ban/unban fields
    isBanned: {
        type: Boolean,
        default: false,
        index: true
    },
    banReason: {
        type: String,
        trim: true
    },
    bannedAt: {
        type: Date
    },
    bannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    otp: {
        type: String,
        trim: true
    },
    otpExpires: {
        type: Date
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    twoFactorAuth: {
        type: Boolean,
        default: false
    },
    lastLoginAt: Date,
    preferences: {
        notifications: {
            type: Boolean,
            default: true
        },
        language: {
            type: String,
            default: 'vi'
        },
        darkMode: {
            type: Boolean,
            default: false
        }
    },
    savedPaymentMethods: [{
        type: {
            type: String,
            required: true
        },
        lastFour: String,
        expiryDate: String,
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }],
    friends: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'blocked'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ 'friends.user': 1 });

// Hash mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Phương thức so sánh mật khẩu
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;