const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// Middleware: Inject eventId from params to query (for getAllReviews)
router.use((req, res, next) => {
  if (req.params.eventId) {
    req.query.eventId = req.params.eventId;
  }
  next();
});

router.route('/')
  .post(protect, createReview)
  .get(getAllReviews);

router.route('/:id')
  .get(getReviewById)
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;