const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // POS payment fields
  pos_TxnRef: {
    type: String,
    required: true,
    unique: true
  },
  pos_TransactionId: {
    type: String,
    sparse: true
  },
  pos_PayDate: {
    type: Date
  },
  
  // VietQR fields
  vietqr_qrDataURL: {
    type: String
  },
  vietqr_bankInfo: {
    accountNo: String,
    accountName: String,
    bankName: String
  },
  vietqr_isFallback: {
    type: Boolean,
    default: false
  },
  
  // PayOS fields
  payos_orderCode: {
    type: String
  },
  payos_checkoutUrl: {
    type: String
  },
  payos_paymentLinkId: {
    type: String
  },
  payos_transactionDateTime: {
    type: Date
  },
  payos_status: {
    type: String
  },
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
  selectedSeats: [{
    sectionName: String,
    rowName: String,
    seatNumber: String,
    price: Number,
    ticketType: String
  }],
  selectedTickets: [{
    ticketTypeId: String,
    quantity: Number,
    price: Number,
    ticketTypeName: String
  }],
  bookingType: {
    type: String,
    enum: ['seating', 'simple'],
    default: 'seating'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  orderInfo: {
    type: String,
    default: 'Thanh toán vé sự kiện'
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['pos'],
    default: 'pos'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
paymentSchema.index({ pos_TxnRef: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ event: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
