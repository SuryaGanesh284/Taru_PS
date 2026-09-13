const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const Event = require('../models/Event');
const { AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

const formatWishlistResponse = (wishlist) => {
  const obj = wishlist.toObject ? wishlist.toObject() : { ...wishlist };
  if (obj.items) {
    obj.items = obj.items.map((item) => {
      const populatedProduct = item.productId && typeof item.productId === 'object' ? item.productId : null;
      const product = populatedProduct || { _id: item.productId };
      return {
        ...item,
        productId: product._id || item.productId,
        product,
      };
    });
  }
  return obj;
};

const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.userId })
      .populate('items.productId', 'title images price status rating sellerId');
    if (!wishlist) wishlist = await Wishlist.create({ userId: req.userId, items: [] });
    return success(res, formatWishlistResponse(wishlist));
  } catch (err) { next(err); }
};

const addToWishlist = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.body.productId;
    if (!productId) throw new AppError('Product ID required', 400, 'PRODUCT_ID_REQUIRED');

    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');

    let wishlist = await Wishlist.findOne({ userId: req.userId });
    if (!wishlist) wishlist = await Wishlist.create({ userId: req.userId, items: [] });

    const already = wishlist.items.some((i) => i.productId.toString() === productId.toString());
    if (!already) {
      wishlist.items.push({ productId });
      await wishlist.save();
      Event.create({ userId: req.userId, type: 'wishlist_add', entityId: product._id, entityType: 'product' }).catch(() => {});
    }

    await wishlist.populate('items.productId', 'title images price status rating sellerId');
    return success(res, formatWishlistResponse(wishlist));
  } catch (err) { next(err); }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.userId });
    if (!wishlist) throw new AppError('Wishlist not found', 404, 'NOT_FOUND');

    const targetId = req.params.productId;
    wishlist.items = wishlist.items.filter((i) => i.productId.toString() !== targetId && i._id.toString() !== targetId);
    await wishlist.save();

    Event.create({ userId: req.userId, type: 'wishlist_remove', entityId: targetId, entityType: 'product' }).catch(() => {});
    await wishlist.populate('items.productId', 'title images price status rating sellerId');
    return success(res, formatWishlistResponse(wishlist));
  } catch (err) { next(err); }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
