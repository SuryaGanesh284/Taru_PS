const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const sellerCtrl = require('../controllers/seller.controller');

// Seller-specific routes (require auth)
router.post('/profile', authenticate, authorize('SELLER', 'BUYER'), sellerCtrl.createProfile);
router.get('/me', authenticate, authorize('SELLER'), sellerCtrl.getMyProfile);
router.patch('/me', authenticate, authorize('SELLER'), sellerCtrl.updateProfile);
router.post('/me/verification', authenticate, authorize('SELLER'), sellerCtrl.submitVerification);
router.get('/me/dashboard', authenticate, authorize('SELLER'), sellerCtrl.getDashboard);
router.get('/me/products', authenticate, authorize('SELLER'), sellerCtrl.getMyProducts);
router.get('/me/analytics', authenticate, authorize('SELLER'), sellerCtrl.getAnalytics);

// Seller orders routes (support both /me/orders and /orders for compatibility)
router.get('/me/orders', authenticate, authorize('SELLER'), sellerCtrl.getMyOrders);
router.get('/orders', authenticate, authorize('SELLER'), sellerCtrl.getMyOrders);

router.get('/me/orders/:orderId', authenticate, authorize('SELLER'), sellerCtrl.getMyOrder);
router.get('/orders/:orderId', authenticate, authorize('SELLER'), sellerCtrl.getMyOrder);

router.patch('/me/orders/:orderId/status', authenticate, authorize('SELLER'), sellerCtrl.updateOrderStatus);
router.patch('/orders/:orderId/status', authenticate, authorize('SELLER'), sellerCtrl.updateOrderStatus);

router.post('/me/orders/:orderId/ship', authenticate, authorize('SELLER'), sellerCtrl.shipOrder);
router.post('/orders/:orderId/ship', authenticate, authorize('SELLER'), sellerCtrl.shipOrder);

// Public seller profile — defined AFTER /me and /orders to prevent matching
router.get('/:sellerId', sellerCtrl.getPublicProfile);

module.exports = router;
