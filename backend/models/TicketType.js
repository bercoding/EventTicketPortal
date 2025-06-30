const mongoose = require('mongoose');

const ticketTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ticket type name is required.'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required.'],
    min: [0, 'Price cannot be negative.'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required.'],
    min: [0, 'Quantity cannot be negative.'],
  },
  description: {
    type: String,
    trim: true,
  },
  event: {
    type: mongoose.Schema.ObjectId,
    ref: 'Event',
    required: true,
  },
  color: { // Thêm màu sắc để hiển thị trên frontend
    type: String,
    default: '#6B7280' // Màu xám mặc định
  }
}, {
  timestamps: true,
});

const TicketType = mongoose.model('TicketType', ticketTypeSchema);

module.exports = TicketType; 