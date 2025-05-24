const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên địa điểm là bắt buộc'],
    trim: true
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
  capacity: {
    type: Number,
    min: 1
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
  },
  facilities: [String],
  images: [String],
  contactInfo: {
    phone: String,
    email: String,
    website: String
  }
}, { timestamps: true });

// Indexes
venueSchema.index({ city: 1, country: 1 });
venueSchema.index({ "coordinates.coordinates": '2dsphere' });
venueSchema.index({ name: 'text' });

const Venue = mongoose.model('Venue', venueSchema);

module.exports = Venue;
