const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// CREATE a review
router.post('/', reviewController.createReview);

// READ all reviews
router.get('/', reviewController.getAllReviews);

// READ a single review by ID
router.get('/:id', reviewController.getReviewById);

// UPDATE a review by ID
router.put('/:id', reviewController.updateReview);

// DELETE a review by ID
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
