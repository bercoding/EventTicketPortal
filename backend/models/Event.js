const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tên sự kiện là bắt buộc'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Mô tả sự kiện là bắt buộc']
  },
  images: [String],
  startDate: {
    type: Date,
    required: [true, 'Ngày bắt đầu là bắt buộc']
  },
  endDate: {
    type: Date,
    required: [true, 'Ngày kết thúc là bắt buộc']
  },
  location: {
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue'
    },
    address: {
      type: String,
      required: [true, 'Địa chỉ là bắt buộc']
    },
    city: {
      type: String,
      required: [true, 'Thành phố là bắt buộc']
    },
    country: {
      type: String,
      required: [true, 'Quốc gia là bắt buộc']
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        index: '2dsphere'
      }
    },
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  category: [{
    type: String,
    required: [true, 'Danh mục là bắt buộc']
  }],
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'cancelled', 'completed'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'featured'],
    default: 'public'
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Chủ sự kiện là bắt buộc']
  },
  capacity: {
    type: Number,
    min: 1
  },
  availableSeats: {
    type: Number,
    min: 0
  },
  seatingMap: {
    layout: Object,
    sections: [{
      name: String,
      price: Number,
      totalSeats: Number,
      availableSeats: Number,
      rows: [{
        name: String,
        seats: [{
          number: String,
          status: {
            type: String,
            enum: ['available', 'reserved', 'sold'],
            default: 'available'
          }
        }]
      }]
    }]
  },
  ticketTypes: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    available: {
      type: Number,
      min: 0
    },
    benefits: [String],
    salesStartDate: Date,
    salesEndDate: Date
  }],
  discountCodes: [{
    code: {
      type: String,
      required: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    maxUses: Number,
    usedCount: {
      type: Number,
      default: 0
    },
    expiryDate: Date
  }],
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, { timestamps: true });

// Indexes
eventSchema.index({ organizer: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ 'location.city': 1 });
eventSchema.index({ 'location.coordinates.coordinates': '2dsphere' });
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Đảm bảo ngày kết thúc sau ngày bắt đầu
eventSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    return next(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
  }
  next();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
