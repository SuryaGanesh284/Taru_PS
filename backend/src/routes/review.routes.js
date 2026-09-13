const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../middleware/auth');
const reviewCtrl = require('../controllers/review.controller');

// Mounted at /api/v1/products/:productId/reviews AND /api/v1/reviews
router.get('/products/:productId/reviews', reviewCtrl.listReviews);
router.post('/products/:productId/reviews', authenticate, reviewCtrl.createReview);
router.patch('/reviews/:reviewId', authenticate, reviewCtrl.editReview);
router.delete('/reviews/:reviewId', authenticate, reviewCtrl.deleteReview);

module.exports = router;
