const mongoose = require('mongoose');

const refundRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        index: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    refundAmount: {
        type: Number,
        required: true, // Số tiền thực hoàn = amount - 25%
        min: 0
    },
    bankInfo: {
        bankName: {
            type: String,
            required: true,
            trim: true
        },
        accountNumber: {
            type: String,
            required: true,
            trim: true
        },
        accountHolderName: {
            type: String,
            required: true,
            trim: true
        },
        branch: String
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'rejected'],
        default: 'pending',
        index: true
    },
    adminNotes: {
        type: String,
        trim: true
    },
    completedAt: {
        type: Date
    },
    completedBy: {
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

// Indexes for frequent queries
refundRequestSchema.index({ status: 1, createdAt: -1 });
refundRequestSchema.index({ user: 1, status: 1 });
refundRequestSchema.index({ event: 1, status: 1 });

const RefundRequest = mongoose.model('RefundRequest', refundRequestSchema);

module.exports = RefundRequest; 