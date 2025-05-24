const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
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
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// Indexes
commentSchema.index({ postId: 1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ parentId: 1 });
commentSchema.index({ status: 1 });

// Virtual field để tính số lượng likes
commentSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

// Khi lưu comment, tự động thêm vào mảng comments của post
commentSchema.post('save', async function() {
  if (this.status === 'approved' && !this.parentId) {
    const Post = mongoose.model('Post');
    await Post.findByIdAndUpdate(this.postId, 
      { $addToSet: { comments: this._id } }
    );
  }
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
