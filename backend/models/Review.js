const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: String,
  images: [String],
  likes: {
    type: Number,
    default: 0
  },
  reports: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// Indexes
reviewSchema.index({ eventId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ eventId: 1, rating: 1 });
reviewSchema.index({ status: 1 });

// Cập nhật rating trung bình cho event
reviewSchema.post('save', async function() {
  if (this.status === 'approved') {
    const Event = mongoose.model('Event');
    const stats = await this.constructor.aggregate([
      {
        $match: {
          eventId: this.eventId,
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$eventId',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    if (stats.length > 0) {
      await Event.findByIdAndUpdate(this.eventId, {
        'ratings.average': stats[0].avgRating,
        'ratings.count': stats[0].count
      });
    }
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
