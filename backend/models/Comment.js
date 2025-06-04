const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  userID: {
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
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: []
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  comment_image: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Indexes
commentSchema.index({ postId: 1 });
commentSchema.index({ userID: 1 });
commentSchema.index({ parentId: 1 });
commentSchema.index({ status: 1 });

// Virtual field để tính số lượng likes
commentSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual field để tính số lượng replies
commentSchema.virtual('replyCount').get(function() {
  return this.replies.length;
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