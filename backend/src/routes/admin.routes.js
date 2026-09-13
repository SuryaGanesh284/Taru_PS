const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const adminCtrl = require('../controllers/admin.controller');

// All admin routes require authentication and ADMIN role
router.use(authenticate, authorize('ADMIN'));

// Platform stats
router.get('/stats', adminCtrl.getPlatformStats);

// User management
router.get('/users', adminCtrl.listUsers);
router.patch('/users/:userId/status', adminCtrl.updateUserStatus);

// Seller verification
router.get('/sellers/pending', adminCtrl.getPendingSellers);
router.patch('/sellers/:sellerId/verification', adminCtrl.updateSellerVerification);

// Product moderation
router.get('/products/pending', adminCtrl.getPendingProducts);
router.patch('/products/:productId/moderation', adminCtrl.moderateProduct);

// Orders & refunds
router.get('/orders', adminCtrl.listAllOrders);
router.post('/refunds', adminCtrl.initiateRefund);

// Audit & observability
router.get('/audit-logs', adminCtrl.getAuditLogs);
router.get('/ai/runs', adminCtrl.getAiRuns);

module.exports = router;
