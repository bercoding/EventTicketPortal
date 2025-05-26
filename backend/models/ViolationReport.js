const mongoose = require('mongoose');

const violationReportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    reportedContent: {
        contentType: {
            type: String,
            enum: ['post', 'comment', 'event', 'user_profile', 'message'],
            required: true
        },
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        contentUrl: String
    },
    violationType: {
        type: String,
        enum: [
            'spam',
            'harassment',
            'hate_speech',
            'inappropriate_content',
            'fake_information',
            'copyright_violation',
            'fraud',
            'other'
        ],
        required: true,
        index: true
    },
    description: {
        type: String,
        required: [true, 'Mô tả vi phạm là bắt buộc'],
        trim: true,
        maxlength: [1000, 'Mô tả không được vượt quá 1000 ký tự']
    },
    evidence: [{
        type: {
            type: String,
            enum: ['image', 'video', 'document', 'link'],
            required: true
        },
        url: {
            type: String,
            required: true
        },
        description: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'under_review', 'resolved', 'dismissed'],
        default: 'pending',
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
        index: true
    },
    adminAction: {
        actionTaken: {
            type: String,
            enum: [
                'no_action',
                'warning_issued',
                'content_removed',
                'user_suspended',
                'user_banned',
                'other'
            ]
        },
        actionDescription: String,
        actionDate: Date,
        actionBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
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
violationReportSchema.index({ reporter: 1, reportedUser: 1 });
violationReportSchema.index({ violationType: 1, status: 1 });
violationReportSchema.index({ 'reportedContent.contentType': 1, 'reportedContent.contentId': 1 });
violationReportSchema.index({ createdAt: -1 });
violationReportSchema.index({ priority: 1, status: 1 });

const ViolationReport = mongoose.model('ViolationReport', violationReportSchema);

module.exports = ViolationReport; 