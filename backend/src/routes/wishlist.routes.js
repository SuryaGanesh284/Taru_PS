const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const wishlistCtrl = require('../controllers/wishlist.controller');

router.use(authenticate);
router.get('/', wishlistCtrl.getWishlist);
router.post('/', wishlistCtrl.addToWishlist);
router.post('/items/:productId', wishlistCtrl.addToWishlist);
router.delete('/:productId', wishlistCtrl.removeFromWishlist);
router.delete('/items/:productId', wishlistCtrl.removeFromWishlist);

module.exports = router;
