const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const sellerCtrl = require('../controllers/seller.controller');

// All seller routes require auth
router.use(authenticate);

// Seller-specific routes (require SELLER role)
router.post('/profile', authorize('SELLER', 'BUYER'), sellerCtrl.createProfile);
router.get('/me', authorize('SELLER'), sellerCtrl.getMyProfile);
router.patch('/me', authorize('SELLER'), sellerCtrl.updateProfile);
router.post('/me/verification', authorize('SELLER'), sellerCtrl.submitVerification);
router.get('/me/dashboard', authorize('SELLER'), sellerCtrl.getDashboard);
router.get('/me/products', authorize('SELLER'), sellerCtrl.getMyProducts);
router.get('/me/analytics', authorize('SELLER'), sellerCtrl.getAnalytics);

// Seller orders routes (support both /me/orders and /orders for compatibility)
router.get('/me/orders', authorize('SELLER'), sellerCtrl.getMyOrders);
router.get('/orders', authorize('SELLER'), sellerCtrl.getMyOrders);

router.get('/me/orders/:orderId', authorize('SELLER'), sellerCtrl.getMyOrder);
router.get('/orders/:orderId', authorize('SELLER'), sellerCtrl.getMyOrder);

router.patch('/me/orders/:orderId/status', authorize('SELLER'), sellerCtrl.updateOrderStatus);
router.patch('/orders/:orderId/status', authorize('SELLER'), sellerCtrl.updateOrderStatus);

router.post('/me/orders/:orderId/ship', authorize('SELLER'), sellerCtrl.shipOrder);
router.post('/orders/:orderId/ship', authorize('SELLER'), sellerCtrl.shipOrder);

// Public seller profile — must be defined AFTER /me and /me/* to prevent matching 'me' as sellerId
router.get('/:sellerId', sellerCtrl.getPublicProfile);

module.exports = router;
