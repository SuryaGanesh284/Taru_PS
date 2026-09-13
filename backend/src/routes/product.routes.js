const express = require('express');
const router = express.Router();
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const productCtrl = require('../controllers/product.controller');

// Public reads (with optional auth for event tracking)
router.get('/', optionalAuth, productCtrl.listProducts);
router.get('/:productId', optionalAuth, productCtrl.getProduct);
router.get('/:productId/inventory', authenticate, productCtrl.getInventory);

// Seller-only writes
router.post('/', authenticate, authorize('SELLER'), productCtrl.createProduct);
router.patch('/:productId', authenticate, authorize('SELLER', 'ADMIN'), productCtrl.updateProduct);
router.delete('/:productId', authenticate, authorize('SELLER', 'ADMIN'), productCtrl.archiveProduct);
router.post('/:productId/publish', authenticate, authorize('SELLER'), productCtrl.publishProduct);
router.post('/:productId/unpublish', authenticate, authorize('SELLER'), productCtrl.unpublishProduct);
router.post('/:productId/media', authenticate, authorize('SELLER'), productCtrl.attachMedia);
router.delete('/:productId/media/:mediaId', authenticate, authorize('SELLER'), productCtrl.deleteMedia);
router.put('/:productId/inventory', authenticate, authorize('SELLER'), productCtrl.updateInventory);

module.exports = router;
