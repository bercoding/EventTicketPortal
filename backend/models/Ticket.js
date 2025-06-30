const mongoose = require('mongoose');
const crypto = require('crypto');

const ticketSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  price: {
    type: Number,
    required: true
  },
  purchaseDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['available', 'active', 'returned'],
    default: 'available'
  },
  qrCode: {
    type: String,
    required: true,
    unique: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false,
    default: null
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
  transferredAt: Date,
  returnedAt: {
    type: Date,
    default: null
  },
  refundAmount: {
    type: Number,
    default: null
  }
}, { timestamps: true });

// Indexes
ticketSchema.index({ bookingId: 1 });
ticketSchema.index({ event: 1 });
ticketSchema.index({ user: 1 });
ticketSchema.index({ qrCode: 1 }, { unique: true });
ticketSchema.index({ isUsed: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ event: 1, status: 1 });

// Generate QR code before validation
ticketSchema.pre('validate', function(next) {
  if (this.isNew && !this.qrCode) {
    // Create a unique QR code based on the ticket's _id and random bytes
    this.qrCode = `${this._id}-${crypto.randomBytes(6).toString('hex')}`;
  }
  next();
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
