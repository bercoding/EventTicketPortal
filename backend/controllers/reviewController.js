const Review = require('../models/Review');

/**
 * Get all reviews (optionally filtered by eventId)
 */
exports.getAllReviews = async (req, res) => {
  try {
    const filter = {};
    if (req.query.eventId) filter.eventId = req.query.eventId;
    // Optionally support other query params, e.g., userId, status, etc.
    if (req.query.status) filter.status = req.query.status;

    const reviews = await Review.find(filter)
      .populate('userId', 'username fullName avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách đánh giá', error: error.message });
  }
};

/**
 * Get a single review by its ID
 */
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('userId', 'username fullName avatar');
    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá', error: error.message });
  }
};

/**
 * Create a new review (requires authenticated user)
 */
exports.createReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const eventId = req.params.eventId || req.body.eventId;
    const { rating, comment, images } = req.body;

    // Check if user already reviewed this event
    const existed = await Review.findOne({ userId, eventId });
    if (existed) {
      return res.status(400).json({ message: 'Bạn đã đánh giá sự kiện này rồi.' });
    }

    const review = new Review({
      eventId,
      userId,
      rating,
      comment,
      images
    });

    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo đánh giá', error: error.message });
  }
};

/**
 * Update a review (only owner or admin can update)
 */
exports.updateReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }

    // Only owner can update
    if (review.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Không có quyền sửa đánh giá này' });
    }

    // Only allow certain fields to be updated
    const { rating, comment, images, status } = req.body;
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    if (images !== undefined) review.images = images;
    if (status && req.user.role === 'admin') review.status = status; // Only admin can update status

    await review.save();
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật đánh giá', error: error.message });
  }
};

/**
 * Delete a review (only owner or admin)
 */
exports.deleteReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }

    // Only owner or admin
    if (review.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Không có quyền xóa đánh giá này' });
    }

    await review.deleteOne();
    res.json({ message: 'Xóa đánh giá thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa đánh giá', error: error.message });
  }
};