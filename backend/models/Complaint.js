const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Thêm trường bannedUser để lưu ID của người bị khóa tài khoản (người cần mở khóa)
    bannedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    subject: {
        type: String,
        required: [true, 'Chủ đề khiếu nại là bắt buộc'],
        trim: true,
        maxlength: [200, 'Chủ đề không được vượt quá 200 ký tự']
    },
    description: {
        type: String,
        required: [true, 'Mô tả khiếu nại là bắt buộc'],
        trim: true,
        maxlength: [2000, 'Mô tả không được vượt quá 2000 ký tự']
    },
    category: {
        type: String,
        enum: ['payment', 'event', 'user_behavior', 'technical', 'other'],
        required: true,
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'resolved', 'closed'],
        default: 'pending',
        index: true
    },
    relatedEvent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    },
    relatedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    attachments: [{
        filename: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    resolution: {
        type: String,
        trim: true
    },
    resolvedAt: {
        type: Date
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    adminNotes: [{
        note: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

// Indexes
complaintSchema.index({ user: 1, status: 1 });
complaintSchema.index({ category: 1, priority: 1 });
complaintSchema.index({ createdAt: -1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint; 