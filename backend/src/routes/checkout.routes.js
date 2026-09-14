const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const checkoutCtrl = require('../controllers/checkout.controller');

router.use(authenticate, authorize('BUYER', 'SELLER', 'ADMIN'));

router.post('/quote', checkoutCtrl.getQuote);
router.post('/create-order', checkoutCtrl.createOrder);

module.exports = router;
