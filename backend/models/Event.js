const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    number: { type: String, required: true },
    status: { type: String, enum: ['available', 'sold', 'reserved'], default: 'available' },
    x: { type: Number, required: true }, // Tọa độ X
    y: { type: Number, required: true }, // Tọa độ Y
    overridePrice: { type: Number } // Giá riêng cho ghế này nếu cần
}, { _id: true });

const rowSchema = new mongoose.Schema({
    name: { type: String, required: true },
    seats: [seatSchema]
}, { _id: false });

const sectionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    ticketTier: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType' }, // Tham chiếu đến loại vé
    rows: [rowSchema]
}, { _id: false });

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
      enum: ['online', 'offline'],
      required: true
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue'
    },
    venueName: String,
    address: String,
    ward: String,
    district: String,
    city: String,
    country: {
      type: String,
      default: 'Vietnam'
    },
    venueLayout: {
      type: String,
      enum: ['hall', 'theater', 'stadium', 'outdoor'],
      default: 'hall'
    },
    // Fields for online events
    meetingLink: String,
    platform: {
      type: String,
      enum: ['zoom', 'google-meet', 'microsoft-teams', 'facebook-live', 'youtube-live', 'other']
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
    longitude: Number
  },
  category: [String],
  tags: [String],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
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
    required: true,
    min: 1
  },
  availableSeats: {
    type: Number,
    default: function() { return this.capacity; }
  },
  eventOrganizerDetails: {
    logo: String,
    name: String,
    info: String
  },
  seatingMap: {
    layoutType: { 
      type: String, 
      enum: ['cinema', 'stadium', 'theater', 'concert', 'outdoor', 'custom'], 
      required: function() { return this.templateType === 'seating'; }
    },
    sections: [sectionSchema],
    stage: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      centerX: Number,
      centerY: Number,
      gradient: {
        start: String,
        end: String
      },
      lighting: [{
        x: Number,
        y: Number,
        radius: Number
      }]
    }
  },
  ticketTypes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TicketType'
  }],
  // Template type để phân biệt loại sự kiện
  templateType: {
    type: String,
    enum: ['seating', 'general', 'online'],
    default: 'general'
  },
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
  },
  // Admin controllable features
  featured: {
    type: Boolean,
    default: false
  },
  trending: {
    type: Boolean,
    default: false
  },
  special: {
    type: Boolean,
    default: false
  },
  featuredOrder: {
    type: Number,
    default: 0
  },
  trendingOrder: {
    type: Number,
    default: 0
  },
  specialOrder: {
    type: Number,
    default: 0
  }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Indexes
eventSchema.index({ organizers: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ visibility: 1 });
eventSchema.index({ 'location.city': 1 });
eventSchema.index({ 'location.coordinates.coordinates': '2dsphere' });
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ featured: 1, featuredOrder: 1 });
eventSchema.index({ trending: 1, trendingOrder: 1 });
eventSchema.index({ special: 1, specialOrder: 1 });

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