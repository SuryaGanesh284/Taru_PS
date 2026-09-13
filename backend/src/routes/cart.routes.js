const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const cartCtrl = require('../controllers/cart.controller');

router.use(authenticate);

router.get('/', cartCtrl.getCart);
router.post('/items', cartCtrl.addItem);
router.patch('/items/:itemId', cartCtrl.updateItem);
router.delete('/items/:itemId', cartCtrl.removeItem);
router.delete('/', cartCtrl.clearCart);
router.post('/validate', cartCtrl.validateCart);

module.exports = router;
