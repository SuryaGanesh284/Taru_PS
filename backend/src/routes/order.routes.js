const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const orderCtrl = require('../controllers/order.controller');

router.use(authenticate);

router.get('/', orderCtrl.listOrders);
router.get('/:orderId', orderCtrl.getOrder);
router.post('/:orderId/cancel', orderCtrl.cancelOrder);
router.get('/:orderId/tracking', orderCtrl.getTracking);
router.get('/:orderId/invoice', orderCtrl.getInvoice);
router.post('/:orderId/invoice/regenerate', orderCtrl.regenerateInvoice);

module.exports = router;
