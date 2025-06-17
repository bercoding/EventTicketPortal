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
  images: {
    logo: String,
    banner: String
  },
  startDate: {
    type: Date,
    required: [true, 'Ngày bắt đầu là bắt buộc']
  },
  endDate: {
    type: Date,
    required: [true, 'Ngày kết thúc là bắt buộc']
  },
  location: {
    type: {
      type: String,
      enum: ['offline', 'online'],
      default: 'offline'
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue'
    },
    venueName: {
      type: String,
      trim: true
    },
    address: {
      type: String
    },
    ward: {
      type: String
    },
    district: {
      type: String
    },
    city: {
      type: String
    },
    country: {
      type: String
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
    latitude: Number,
    longitude: Number,
    venueLayout: {
      type: String,
      enum: ['hall', 'cinema', 'stadium'],
      default: 'hall'
    }
  },
  category: [{
    type: String,
    required: [true, 'Danh mục là bắt buộc']
  }],
  tags: [String],
  status: {
    type: String,
    enum: ['pending', 'approved', 'cancelled', 'completed'],
    default: 'pending'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'featured'],
    default: 'public'
  },
  organizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Chủ sự kiện là bắt buộc']
  }],
  capacity: {
    type: Number,
    min: 1
  },
  availableSeats: {
    type: Number,
    min: 0
  },
  eventOrganizerDetails: {
    logo: String,
    name: String,
    info: String
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
  detailedDescription: {
    mainProgram: String,
    guests: String,
    specialExperiences: String
  },
  termsAndConditions: String,
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
eventSchema.index({ organizers: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ visibility: 1 });
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

// Validation cho seatingMap
eventSchema.pre('save', function(next) {
  if (this.seatingMap && this.seatingMap.sections) {
    this.seatingMap.sections.forEach(section => {
      if (section.availableSeats > section.totalSeats) {
        return next(new Error('Available seats in section cannot exceed total seats'));
      }
    });
  }
  next();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;