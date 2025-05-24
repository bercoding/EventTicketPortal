const mongoose = require('mongoose');
const crypto = require('crypto');

const ticketSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ticketType: {
    type: String,
    required: true
  },
  seat: {
    section: String,
    row: String,
    seatNumber: String
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  qrCode: {
    type: String,
    unique: true
  },
  barcode: String,
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: Date,
  isTransferred: {
    type: Boolean,
    default: false
  },
  transferredTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  transferredAt: Date
}, { timestamps: true });

// Indexes
ticketSchema.index({ bookingId: 1 });
ticketSchema.index({ eventId: 1 });
ticketSchema.index({ userId: 1 });
ticketSchema.index({ qrCode: 1 }, { unique: true });
ticketSchema.index({ isUsed: 1 });

// Tạo mã QR trước khi lưu
ticketSchema.pre('save', function(next) {
  if (!this.qrCode) {
    // Tạo mã QR ngẫu nhiên kết hợp với ID của vé
    this.qrCode = `${this._id}-${crypto.randomBytes(6).toString('hex')}`;
  }
  next();
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
