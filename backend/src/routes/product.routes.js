const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const productCtrl = require('../controllers/product.controller');
const reviewCtrl = require('../controllers/review.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Public reads (with optional auth for event tracking)
router.get('/', optionalAuth, productCtrl.listProducts);
router.get('/samples', productCtrl.getSampleProducts);
router.get('/:productId', optionalAuth, productCtrl.getProduct);
router.get('/:productId/inventory', authenticate, productCtrl.getInventory);

// Product reviews
router.get('/:productId/reviews', reviewCtrl.listReviews);
router.post('/:productId/reviews', authenticate, reviewCtrl.createReview);

// Seller-only writes
router.post('/', authenticate, authorize('SELLER'), productCtrl.createProduct);
router.patch('/:productId', authenticate, authorize('SELLER', 'ADMIN'), productCtrl.updateProduct);
router.delete('/:productId', authenticate, authorize('SELLER', 'ADMIN'), productCtrl.archiveProduct);
router.post('/:productId/publish', authenticate, authorize('SELLER'), productCtrl.publishProduct);
router.post('/:productId/unpublish', authenticate, authorize('SELLER'), productCtrl.unpublishProduct);
router.post('/:productId/media', authenticate, authorize('SELLER'), upload.any(), productCtrl.attachMedia);
router.delete('/:productId/media/:mediaId', authenticate, authorize('SELLER'), productCtrl.deleteMedia);
router.put('/:productId/inventory', authenticate, authorize('SELLER'), productCtrl.updateInventory);
router.patch('/:productId/inventory', authenticate, authorize('SELLER'), productCtrl.updateInventory);
router.post('/:productId/unique-item', authenticate, authorize('SELLER'), productCtrl.registerUniqueItem);

module.exports = router;
