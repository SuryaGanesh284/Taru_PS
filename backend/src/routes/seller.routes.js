const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const sellerCtrl = require('../controllers/seller.controller');

// All seller routes require auth
router.use(authenticate);

// Public seller profile
router.get('/:sellerId', sellerCtrl.getPublicProfile);

// Seller-specific routes (require SELLER role)
router.post('/profile', authorize('SELLER', 'BUYER'), sellerCtrl.createProfile);
router.get('/me', authorize('SELLER'), sellerCtrl.getMyProfile);
router.patch('/me', authorize('SELLER'), sellerCtrl.updateProfile);
router.post('/me/verification', authorize('SELLER'), sellerCtrl.submitVerification);
router.get('/me/dashboard', authorize('SELLER'), sellerCtrl.getDashboard);
router.get('/me/products', authorize('SELLER'), sellerCtrl.getMyProducts);
router.get('/me/orders', authorize('SELLER'), sellerCtrl.getMyOrders);
router.get('/me/analytics', authorize('SELLER'), sellerCtrl.getAnalytics);

module.exports = router;
