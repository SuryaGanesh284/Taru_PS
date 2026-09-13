const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const paymentCtrl = require('../controllers/payment.controller');
const rateLimiter = require('../middleware/rateLimiter');

router.use(authenticate);
router.post('/create-intent', rateLimiter.payment, paymentCtrl.createIntent);
router.get('/:paymentId/status', paymentCtrl.getPaymentStatus);
router.get('/:paymentId', paymentCtrl.getPaymentStatus);

module.exports = router;
