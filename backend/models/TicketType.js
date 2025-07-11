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

  totalQuantity: {
    type: Number,
    required: [true, 'Total quantity is required.'],
    min: [0, 'Total quantity cannot be negative.'],
  },
  availableQuantity: {
    type: Number,
    min: [0, 'Available quantity cannot be negative.'],
    default: function() {
      return this.totalQuantity;
    }
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
