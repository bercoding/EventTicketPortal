const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  platformFee: {
    type: Number,
    required: true,
    min: 0
  },
  organizerAmount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['sale', 'refund', 'payout'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  settledAt: Date
}, { timestamps: true });

// Indexes
transactionSchema.index({ organizerId: 1 });
transactionSchema.index({ eventId: 1 });
transactionSchema.index({ bookingId: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: 1 });

// Validation
transactionSchema.pre('save', function(next) {
  if (this.amount !== this.platformFee + this.organizerAmount) {
    return next(new Error('Tổng tiền phải bằng phí nền tảng + số tiền cho chủ sự kiện'));
  }
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
