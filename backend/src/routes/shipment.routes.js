const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const shipmentCtrl = require('../controllers/shipment.controller');

router.use(authenticate);

router.get('/:shipmentId', shipmentCtrl.getShipment);
router.post('/', authorize('ADMIN', 'SELLER'), shipmentCtrl.createShipment);
router.post('/:shipmentId/events', authorize('ADMIN'), shipmentCtrl.addTrackingEvent);

module.exports = router;
