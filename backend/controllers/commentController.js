const Comment = require('../models/Comment');
const asyncHandler = require('express-async-handler');
const Post = require('../models/Post'); // Import Post model
const Notification = require('../models/Notification'); // Import Notification model

// Create a new comment
exports.createComment = asyncHandler(async (req, res) => {
  const { postId, content, parentId } = req.body;
  console.log('req.file:', req.file); // debug
  const image = req.file ? req.file.path : null; // Cloudinary trả về URL ở req.file.path
  if (!postId || !content) {
    return res.status(400).json({ success: false, message: 'Missing postId or content' });
  }
  // Log để debug
  console.log('Creating comment:', { postId, content, parentId });
  const comment = await Comment.create({
    postId,
    userID: req.user.id,
    content,
    parentId: parentId || null,
    comment_image: image,
    status: 'approved',
  });

  // --- Create Notification ---
  if (parentId) {
    // It's a reply to a comment
    const parentComment = await Comment.findById(parentId);
    if (parentComment && parentComment.userID.toString() !== req.user.id) {
      const notification = await Notification.create({
        userId: parentComment.userID,
        type: 'reply_comment',
        title: 'Có người đã trả lời bình luận của bạn',
        message: `${req.user.fullName || req.user.username} đã trả lời bình luận của bạn.`,
        relatedTo: {
          type: 'post', // Should still link to the post
          id: postId
        }
      });
      // --- Emit socket event ---
      const io = req.app.get('io');
      io.to(parentComment.userID.toString()).emit('new_notification', notification);
    }
  } else {
    // It's a new comment on a post
    const post = await Post.findById(postId);
    if (post && post.userId.toString() !== req.user.id) {
      const notification = await Notification.create({
        userId: post.userId,
        type: 'new_comment',
        title: 'Có người đã bình luận về bài viết của bạn',
        message: `${req.user.fullName || req.user.username} đã bình luận về bài viết của bạn.`,
        relatedTo: {
          type: 'post',
          id: postId
        }
      });
      // --- Emit socket event ---
      const io = req.app.get('io');
      io.to(post.userId.toString()).emit('new_notification', notification);
    }
  }
  // --- End Notification ---

  // Nếu là reply thì thêm vào replies của comment cha
  if (parentId) {
    await Comment.findByIdAndUpdate(parentId, { $push: { replies: comment._id } });
    // Emit event cho realtime reply
    const io = req.app.get('io');
    if (io) {
      io.emit('comment_replied', { parentId, postId });
    }
  }
  const populated = await Comment.findById(comment._id)
    .populate('userID', 'username fullName avatar')
    .populate({
      path: 'replies',
      populate: { path: 'userID', select: 'username fullName avatar' }
    })
    .lean();
  res.status(201).json({ success: true, data: populated });
});

// Get comments by postId (top-level only)
exports.getCommentsByPost = asyncHandler(async (req, res) => {
  const { postId, offset = 0, limit = 10 } = req.query;
  if (!postId) return res.status(400).json({ success: false, message: 'Missing postId' });
  const comments = await Comment.find({ postId, parentId: null, status: 'approved' })
    .sort({ createdAt: -1 })
    .skip(Number(offset))
    .limit(Number(limit))
    .populate('userID', 'username fullName avatar')
    .populate({ path: 'replies', select: '_id' })
    .lean();
  comments.forEach(c => {
    c.replyCount = c.replies ? c.replies.length : 0;
  });
  res.json({ success: true, data: comments });
});

// Get replies for a comment (recursive)
exports.getReplies = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const maxDepth = 3; // Limit nesting depth
  const fetchReplies = async (parentId, depth = 0) => {
    if (depth >= maxDepth) return [];
    const replies = await Comment.find({ parentId, status: 'approved' })
      .populate('userID', 'username fullName avatar')
      .populate({
        path: 'replies',
        populate: { path: 'userID', select: 'username fullName avatar' }
      })
      .lean();
    for (const reply of replies) {
      reply.replies = await fetchReplies(reply._id, depth + 1);
    }
    return replies;
  };
  const replies = await fetchReplies(id);
  res.json({ success: true, data: replies });
});

// Update a comment
exports.updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const removeImage = req.body.remove_image === 'true';
  const comment = await Comment.findById(id);
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
  if (comment.userID.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (typeof content === 'string') comment.content = content;
  if (req.file) {
    comment.comment_image = req.file.path; // Cloudinary url
  }
  if (removeImage) {
    comment.comment_image = null;
  }
  await comment.save();
  const populated = await Comment.findById(id)
    .populate('userID', 'username fullName avatar')
    .populate({
      path: 'replies',
      populate: { path: 'userID', select: 'username fullName avatar' }
    })
    .lean();
  res.json({ success: true, data: populated });
});

// Delete a comment
exports.deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.findById(id);
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
  if (comment.userID.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  // Recursively delete replies
  const deleteReplies = async (parentId) => {
    const replies = await Comment.find({ parentId });
    for (const reply of replies) {
      await deleteReplies(reply._id);
      await reply.deleteOne();
    }
  };
  await deleteReplies(id);
  await comment.deleteOne();
  // Remove from Post's comments array if top-level
  if (!comment.parentId) {
    const Post = require('../models/Post');
    await Post.findByIdAndUpdate(comment.postId, { $pull: { comments: id } });
  }
  res.json({ success: true });
});

// Get comment count for a post
exports.getCommentCountByPost = asyncHandler(async (req, res) => {
  const { postId } = req.query;
  if (!postId) return res.status(400).json({ success: false, message: 'Missing postId' });
  // Đếm tất cả comment (bao gồm cả reply)
  const count = await Comment.countDocuments({ postId, status: 'approved' });
  res.json({ success: true, data: { count } });
});

// Toggle like/unlike comment
exports.toggleLikeComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const comment = await Comment.findById(id);
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
  const likedIndex = comment.likes.findIndex(like => like.userId.toString() === userId.toString());
  let liked;
  if (likedIndex === -1) {
    comment.likes.push({ userId });
    liked = true;

    // --- Create Notification ---
    if (comment.userID.toString() !== userId) {
      const notification = await Notification.create({
        userId: comment.userID,
        type: 'like_comment',
        title: 'Có người đã thích bình luận của bạn',
        message: `${req.user.fullName || req.user.username} đã thích bình luận của bạn.`,
        relatedTo: {
          type: 'post',
          id: comment.postId
        }
      });
      // --- Emit socket event ---
      const io = req.app.get('io');
      io.to(comment.userID.toString()).emit('new_notification', notification);
    }
    // --- End Notification ---
  } else {
    comment.likes.splice(likedIndex, 1);
    liked = false;
  }
  await comment.save();
  const updatedComment = await Comment.findById(id).populate('likes.userId', 'username fullName avatar');
  res.json({
    success: true,
    liked,
    likesCount: updatedComment.likes.length,
    likes: updatedComment.likes
  });
});

// Get users who liked comment
exports.getCommentLikes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.findById(id).populate('likes.userId', 'username fullName avatar');
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
  res.json({
    success: true,
    users: comment.likes.map(like => like.userId),
    likesCount: comment.likes.length
  });
});