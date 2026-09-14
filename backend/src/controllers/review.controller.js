const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');
const { success, created, paginated } = require('../utils/response');

/**
 * POST /products/:productId/reviews - Create a review (verified purchase only)
 */
const createReview = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const { orderId, rating, title, text, images } = req.body;

    const details = {};
    if (!productId) details.productId = 'Product ID is required';
    if (!orderId) details.orderId = 'Order ID is required';
    if (rating === undefined || rating === null || isNaN(rating)) {
      details.rating = 'Rating is required';
    } else if (Number(rating) < 1 || Number(rating) > 5) {
      details.rating = 'Rating must be between 1 and 5';
    }
    if (Object.keys(details).length > 0) {
      throw new AppError('Validation failed', 422, 'VALIDATION_ERROR', details);
    }

    // Verify the buyer actually purchased this product in this order
    const order = await Order.findOne({
      _id: orderId,
      buyerId: req.userId,
      'items.productId': productId,
      status: 'DELIVERED',
    });
    if (!order) throw new AppError('You can only review products from delivered orders', 403, 'PURCHASE_REQUIRED');

    const review = await Review.create({
      buyerId: req.userId,
      productId,
      orderId,
      rating,
      title,
      text,
      images,
      status: 'PENDING',
      isVerifiedPurchase: true,
    });

    // Update product rating
    const allReviews = await Review.find({ productId, status: 'APPROVED' });
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;
    await Product.findByIdAndUpdate(productId, { rating: Math.round(avgRating * 10) / 10, totalReviews: allReviews.length });

    return created(res, review);
  } catch (err) { next(err); }
};

/**
 * GET /products/:productId/reviews - List approved reviews for a product
 */
const listReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = { productId: req.params.productId, status: 'APPROVED' };
    const sort = req.query.sort === 'helpful' ? { helpfulCount: -1 } : { createdAt: -1 };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('buyerId', 'name avatarUrl'),
      Review.countDocuments(filter),
    ]);

    return paginated(res, reviews, { page, limit, total });
  } catch (err) { next(err); }
};

/**
 * PATCH /reviews/:reviewId - Edit own review
 */
const editReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.reviewId, buyerId: req.userId });
    if (!review) throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');

    const { rating, title, text } = req.body;
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (text) review.text = text;
    review.status = 'PENDING'; // Re-moderate on edit
    await review.save();

    return success(res, review);
  } catch (err) { next(err); }
};

/**
 * DELETE /reviews/:reviewId - Delete own review
 */
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.reviewId, buyerId: req.userId });
    if (!review) throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
    await review.deleteOne();
    return success(res, { message: 'Review deleted' });
  } catch (err) { next(err); }
};

module.exports = { createReview, listReviews, editReview, deleteReview };
