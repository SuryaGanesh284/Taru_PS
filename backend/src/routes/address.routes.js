const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const addressCtrl = require('../controllers/address.controller');

router.use(authenticate);
router.get('/', addressCtrl.listAddresses);
router.post('/', addressCtrl.createAddress);
router.patch('/:addressId', addressCtrl.updateAddress);
router.delete('/:addressId', addressCtrl.deleteAddress);

module.exports = router;
