const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  title: String,
  content: {
    type: String,
    required: true
  },
  images: [String],
  tags: [String],
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'friends'],
    default: 'public'
  }
}, { timestamps: true });

// Indexes
postSchema.index({ userId: 1 });
postSchema.index({ eventId: 1 });
postSchema.index({ status: 1 });
postSchema.index({ visibility: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ content: 'text', title: 'text', tags: 'text' });

// Virtual field để tính số lượng likes
postSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual field để tính số lượng comments
postSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
