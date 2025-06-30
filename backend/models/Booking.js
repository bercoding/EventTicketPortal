const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tickets: [{
    ticketType: {
      type: String,
      required: true
    },
    seat: {
      section: String,
      row: String,
      seatNumber: String,
    },
    price: Number
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  paymentDetails: {
    paymentMethod: String, // 'credit_card', 'paypal', 'wallet'
    transactionId: String,
    paymentDate: Date,
    paidAt: Date
  }
}, { timestamps: true });

// Index để tối ưu tìm kiếm
bookingSchema.index({ event: 1, user: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
