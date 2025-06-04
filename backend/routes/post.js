const express = require('express');
const router = express.Router();
const { createPost, getPosts, getPostById, updatePost, deletePost, toggleLikePost, getPostLikes } = require('../controllers/postController');
const { protect } = require('../middleware/auth');

router.route('/')
  .post(protect, createPost)
  .get(getPosts);

router.route('/:id')
  .get(getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.post('/:id/like', protect, toggleLikePost);
router.get('/:id/likes', getPostLikes);

module.exports = router;