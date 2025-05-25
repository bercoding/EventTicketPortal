const Post = require('../models/Post');
const asyncHandler = require('express-async-handler');
const { cloudinary, storage } = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage: storage });

// Create a new post
const createPost = [
  upload.array('images'),
  asyncHandler(async (req, res) => {
    console.log('Files received:', req.files);
    const { title, content, event, tags, status, visibility } = req.body;
    const user = req.user.id; // Lấy từ middleware protect
    const images = req.files ? req.files.map(file => file.path) : [];

    if (images.length > 10) {
      res.status(400);
      throw new Error('Cannot upload more than 10 images');
    }

    const post = await Post.create({
      user,
      event,
      title,
      content,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      status: status || 'draft',
      visibility: visibility || 'public',
      images
    });

    // Populate user and event
    const populatedPost = await Post.findById(post._id).populate('user', 'username email').populate('event', 'title').lean();

    res.status(201).json({
      success: true,
      data: populatedPost
    });
  })
];

// Get all posts
const getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .populate('user', 'username email')
    .populate('event', 'title')
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
    .populate('user', 'username email')
    .populate('event', 'title')
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
    const { title, content, event, tags, status, visibility } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    if (post.user.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to update this post');
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.event = event || post.event;
    post.tags = tags ? tags.split(',').map(tag => tag.trim()) : post.tags;
    post.status = status || post.status;
    post.visibility = visibility || post.visibility;

    if (req.files && req.files.length > 0) {
      if (req.files.length > 10) {
        res.status(400);
        throw new Error('Cannot upload more than 10 images');
      }

      if (post.images && post.images.length > 0) {
        for (const image of post.images) {
          const publicId = image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`posts/${publicId}`);
        }
      }
      post.images = req.files.map(file => file.path);
    }

    const updatedPost = await post.save();

    // Populate user and event
    const populatedPost = await Post.findById(updatedPost._id).populate('user', 'username email').populate('event', 'title').lean();

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

  if (post.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this post');
  }

  if (post.images && post.images.length > 0) {
    for (const image of post.images) {
      const publicId = image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`posts/${publicId}`);
    }
  }

  await post.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully'
  });
});

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost
};