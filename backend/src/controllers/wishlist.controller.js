const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const Event = require('../models/Event');
const { AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.userId })
      .populate('items.productId', 'title images price status rating sellerId');
    if (!wishlist) wishlist = await Wishlist.create({ userId: req.userId, items: [] });
    return success(res, wishlist);
  } catch (err) { next(err); }
};

const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');

    let wishlist = await Wishlist.findOne({ userId: req.userId });
    if (!wishlist) wishlist = await Wishlist.create({ userId: req.userId, items: [] });

    const already = wishlist.items.some((i) => i.productId.toString() === productId);
    if (!already) {
      wishlist.items.push({ productId });
      await wishlist.save();
      Event.create({ userId: req.userId, type: 'wishlist_add', entityId: product._id, entityType: 'product' }).catch(() => {});
    }

    return success(res, wishlist);
  } catch (err) { next(err); }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.userId });
    if (!wishlist) throw new AppError('Wishlist not found', 404, 'NOT_FOUND');

    wishlist.items = wishlist.items.filter((i) => i.productId.toString() !== req.params.productId);
    await wishlist.save();

    Event.create({ userId: req.userId, type: 'wishlist_remove', entityId: req.params.productId, entityType: 'product' }).catch(() => {});
    return success(res, wishlist);
  } catch (err) { next(err); }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
