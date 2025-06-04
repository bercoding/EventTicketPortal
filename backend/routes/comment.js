const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const { storage } = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage });

// Comment APIs
router.post('/', protect, upload.single('comment_image'), commentController.createComment);
router.get('/', commentController.getCommentsByPost); // ?postId=xxx
router.get('/count', commentController.getCommentCountByPost); // ?postId=xxx
router.get('/:id/replies', commentController.getReplies);
router.put('/:id', protect, upload.single('comment_image'), commentController.updateComment);
router.delete('/:id', protect, commentController.deleteComment);
// Like/unlike comment
router.post('/:id/like', protect, commentController.toggleLikeComment);
// Get users who liked comment
router.get('/:id/likes', commentController.getCommentLikes);

module.exports = router;
