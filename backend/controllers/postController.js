const Post = require('../models/Post');
const asyncHandler = require('express-async-handler');
const { cloudinary, storage } = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage: storage });
const User = require('../models/User');

// Create a new post
const createPost = [
  upload.array('images'),
  asyncHandler(async (req, res) => {
    console.log('Files received:', req.files);
    const { title, content, eventId, tags, status, visibility } = req.body;
    
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401);
      throw new Error('Not authenticated');
    }
    
    const userId = req.user.id; // Lấy từ middleware protect
    // const images = req.files ? req.files.map(file => file.path) : [];
    // Sửa lại để lưu đúng URL ảnh từ Cloudinary
    const images = req.files ? req.files.map(file => file.url || file.path) : [];

    if (images.length > 10) {
      res.status(400);
      throw new Error('Cannot upload more than 10 images');
    }

    const post = await Post.create({
      userId,
      eventId,
      title,
      content,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      status: status || 'pending',
      visibility: visibility || 'public',
      images
    });

    // Populate user and event (bổ sung avatar, fullName)
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'username fullName avatar email')
      .populate('eventId', 'title')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedPost
    });
  })
];

// Get all posts
const getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .populate('userId', 'username fullName avatar email')
    .populate('eventId', 'title')
    .lean();
  if (!posts) {
    return res.status(200).json({ success: true, data: [] }); // Trả về mảng rỗng nếu không có post
  }
  res.status(200).json({
    success: true,
    data: posts
  });
});

// Get a single post by ID
const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('userId', 'username fullName avatar email')
    .populate('eventId', 'title')
    .lean();
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  res.status(200).json({
    success: true,
    data: post
  });
});

// Update a post
const updatePost = [
  upload.array('images'),
  asyncHandler(async (req, res) => {
    const { title, content, eventId, tags, status, visibility } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    if (!req.user || !req.user.id) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    // Only allow post creator to update
    if (post.userId.toString() !== req.user.id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this post');
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.eventId = eventId || post.eventId;
    post.tags = tags ? tags.split(',').map(tag => tag.trim()) : post.tags;
    post.status = status || post.status;
    post.visibility = visibility || post.visibility;

    if (req.files && req.files.length > 0) {
      if (req.files.length > 10) {
        res.status(400);
        throw new Error('Cannot upload more than 10 images');
      }

      // Delete old images from Cloudinary
      if (post.images && post.images.length > 0) {
        for (const image of post.images) {
          try {
          const publicId = image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`posts/${publicId}`);
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }
      }

      // Add new images
      post.images = req.files.map(file => file.url || file.path);
    }

    const updatedPost = await post.save();

    // Populate user and event (bổ sung avatar, fullName)
    const populatedPost = await Post.findById(updatedPost._id)
      .populate('userId', 'username fullName avatar email')
      .populate('eventId', 'title')
      .lean();

    res.status(200).json({
      success: true,
      data: populatedPost
    });
  })
];

// Delete a post
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  if (!req.user || !req.user.id || post.userId.toString() !== req.user.id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this post');
  }

  // Delete images from Cloudinary
  if (post.images && post.images.length > 0) {
    for (const image of post.images) {
      try {
      const publicId = image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`posts/${publicId}`);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
  }

  await post.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully'
  });
});

// Toggle like/unlike post
const toggleLikePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Not authenticated');
  }

  const userId = req.user.id;

  // Kiểm tra userId có tồn tại trong database
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const likedIndex = post.likes.findIndex(like => like.userId.toString() === userId.toString());
  let liked;

  if (likedIndex === -1) {
    post.likes.push({ userId });
    liked = true;
  } else {
    post.likes.splice(likedIndex, 1);
    liked = false;
  }

  try {
    await post.save();
    // Populate userId trong likes để trả về thông tin chi tiết hơn (tùy chọn)
    const updatedPost = await Post.findById(post._id)
      .populate('likes.userId', 'username fullName avatar')
      .lean();

    res.json({
      success: true,
      liked,
      likesCount: post.likes.length,
      likes: updatedPost.likes // Trả về danh sách likes với thông tin user
    });
  } catch (error) {
    res.status(500);
    throw new Error('Error saving like status: ' + error.message);
  }
});

// Get users who liked post
const getPostLikes = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('likes.userId', 'username fullName avatar')
    .lean();

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  // Kiểm tra quyền truy cập
  if (post.visibility === 'private' && (!req.user || post.userId.toString() !== req.user.id.toString())) {
    res.status(403);
    throw new Error('Not authorized to view likes for this post');
  }

  res.json({
    success: true,
    users: post.likes.map(like => like.userId),
    likesCount: post.likes.length
  });
});

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLikePost,
  getPostLikes
};