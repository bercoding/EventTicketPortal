const mongoose = require('mongoose');

const ownerRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    businessName: {
        type: String,
        required: [true, 'Tên doanh nghiệp là bắt buộc'],
        trim: true,
        maxlength: [200, 'Tên doanh nghiệp không được vượt quá 200 ký tự']
    },
    businessType: {
        type: String,
        enum: [
            'individual',
            'company',
            'organization',
            'government',
            'non_profit'
        ],
        required: true
    },
    businessDescription: {
        type: String,
        required: [true, 'Mô tả doanh nghiệp là bắt buộc'],
        trim: true,
        maxlength: [1000, 'Mô tả không được vượt quá 1000 ký tự']
    },
    businessAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    contactInfo: {
        phone: {
            type: String,
            required: [true, 'Số điện thoại là bắt buộc']
        },
        email: {
            type: String,
            required: [true, 'Email liên hệ là bắt buộc']
        },
        website: String
    },
    documents: [{
        type: {
            type: String,
            enum: ['business_license', 'tax_certificate', 'id_card', 'other'],
            required: true
        },
        filename: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    expectedEventTypes: [{
        type: String,
        enum: [
            'conference',
            'workshop',
            'concert',
            'festival',
            'sports',
            'exhibition',
            'networking',
            'other'
        ]
    }],
    estimatedEventFrequency: {
        type: String,
        enum: ['weekly', 'monthly', 'quarterly', 'yearly', 'occasional'],
        required: true
    },
    previousExperience: {
        type: String,
        trim: true,
        maxlength: [500, 'Kinh nghiệm không được vượt quá 500 ký tự']
    },
    status: {
        type: String,
        enum: ['pending', 'under_review', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },
    reviewNotes: [{
        note: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    approvedAt: {
        type: Date
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectedAt: {
        type: Date
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectionReason: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Indexes
ownerRequestSchema.index({ user: 1 });
ownerRequestSchema.index({ status: 1, createdAt: -1 });
ownerRequestSchema.index({ businessType: 1 });

const OwnerRequest = mongoose.model('OwnerRequest', ownerRequestSchema);

module.exports = OwnerRequest; 