const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../middleware/auth');
const reviewCtrl = require('../controllers/review.controller');

// Direct review actions: /api/v1/reviews/:reviewId
router.patch('/:reviewId', authenticate, reviewCtrl.editReview);
router.delete('/:reviewId', authenticate, reviewCtrl.deleteReview);

// When mounted at /api/v1/products/:productId/reviews
router.get('/', reviewCtrl.listReviews);
router.post('/', authenticate, reviewCtrl.createReview);

// Explicit aliases for compatibility
router.get('/products/:productId/reviews', reviewCtrl.listReviews);
router.post('/products/:productId/reviews', authenticate, reviewCtrl.createReview);
router.patch('/reviews/:reviewId', authenticate, reviewCtrl.editReview);
router.delete('/reviews/:reviewId', authenticate, reviewCtrl.deleteReview);

module.exports = router;
