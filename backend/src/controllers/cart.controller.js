const Cart = require('../models/Cart');
const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');
const Event = require('../models/Event');
const { AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

const formatCartResponse = (cart) => {
  const cartObj = cart.toObject ? cart.toObject() : { ...cart };
  if (cartObj.items) {
    cartObj.items = cartObj.items.map((item) => {
      const populatedProduct = item.productId && typeof item.productId === 'object' ? item.productId : null;
      const productIdStr = populatedProduct?._id?.toString() || item.productId?.toString();
      const priceNum = typeof item.price === 'number' ? item.price : (populatedProduct?.price?.discountedAmount || populatedProduct?.price?.amount || 0);

      const product = {
        _id: productIdStr,
        title: populatedProduct?.title || item.title,
        price: priceNum,
        images: populatedProduct?.images?.length
          ? populatedProduct.images
          : (item.imageUrl ? [{ url: item.imageUrl, isPrimary: true }] : []),
        seller: populatedProduct?.sellerId || item.sellerId,
        sellerId: populatedProduct?.sellerId || item.sellerId,
        status: populatedProduct?.status || 'PUBLISHED',
      };

      return {
        ...item,
        productId: productIdStr,
        product,
        price: priceNum,
      };
    });
  }
  return cartObj;
};

/**
 * GET /cart - Get current user's cart
 */
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ buyerId: req.userId })
      .populate('items.productId', 'title images price status type sellerId');

    if (!cart) {
      cart = await Cart.create({ buyerId: req.userId, items: [] });
    }
    return success(res, formatCartResponse(cart));
  } catch (err) { next(err); }
};

/**
 * POST /cart/items - Add item to cart
 */
const addItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1, inventoryItemId } = req.body;
    if (!productId) {
      throw new AppError('Validation failed', 422, 'VALIDATION_ERROR', { productId: 'Product ID is required' });
    }
    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty < 1) {
      throw new AppError('Validation failed', 422, 'VALIDATION_ERROR', { quantity: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product || product.status !== 'PUBLISHED') {
      throw new AppError('Product not available', 404, 'PRODUCT_NOT_FOUND');
    }

    // Check inventory availability
    const inventoryQuery = { productId, status: 'AVAILABLE' };
    if (inventoryItemId) inventoryQuery._id = inventoryItemId;
    const inventory = await InventoryItem.findOne(inventoryQuery);

    if (!inventory) throw new AppError('Product is out of stock', 409, 'OUT_OF_STOCK');
    if (product.type !== 'UNIQUE' && inventory.quantity - inventory.reserved < numQty) {
      throw new AppError('Insufficient stock', 409, 'INSUFFICIENT_STOCK');
    }

    let cart = await Cart.findOne({ buyerId: req.userId });
    if (!cart) cart = await Cart.create({ buyerId: req.userId, items: [] });

    // Check if item already in cart
    const existingItemIdx = cart.items.findIndex(
      (item) => item.productId.toString() === productId &&
        (product.type !== 'UNIQUE' || item.inventoryItemId?.toString() === inventoryItemId)
    );

    const priceValue = typeof product.price === 'number'
      ? product.price
      : (product.price?.discountedAmount || product.price?.amount || 0);

    if (existingItemIdx >= 0) {
      if (product.type === 'UNIQUE') {
        throw new AppError('Unique item already in cart', 409, 'ALREADY_IN_CART');
      }
      cart.items[existingItemIdx].quantity += numQty;
    } else {
      cart.items.push({
        productId,
        inventoryItemId: product.type === 'UNIQUE' ? inventoryItemId : undefined,
        quantity: numQty,
        price: priceValue,
        title: product.title,
        imageUrl: product.images?.find((i) => i.isPrimary)?.url || product.images?.[0]?.url,
        sellerId: product.sellerId,
      });
    }

    cart.version += 1;
    await cart.save();

    // Track cart_add event
    Event.create({ userId: req.userId, type: 'cart_add', entityId: product._id, entityType: 'product' }).catch(() => {});

    await cart.populate('items.productId', 'title images price status type sellerId');
    return success(res, formatCartResponse(cart));
  } catch (err) { next(err); }
};

/**
 * PATCH /cart/items/:itemId - Update item quantity
 */
const updateItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const numQty = Number(quantity);
    if (quantity === undefined || isNaN(numQty) || numQty < 0) {
      throw new AppError('Validation failed', 422, 'VALIDATION_ERROR', { quantity: 'Quantity must be a non-negative number' });
    }

    const cart = await Cart.findOne({ buyerId: req.userId });
    if (!cart) throw new AppError('Cart not found', 404, 'CART_NOT_FOUND');

    const targetId = String(req.params.itemId);
    const item = cart.items.find(
      (i) => i.productId?.toString() === targetId || i._id?.toString() === targetId
    );
    if (!item) throw new AppError('Item not in cart', 404, 'ITEM_NOT_FOUND');

    if (numQty === 0) {
      cart.items.pull(item._id);
    } else {
      item.quantity = numQty;
    }

    cart.version += 1;
    await cart.save();
    await cart.populate('items.productId', 'title images price status type sellerId');
    return success(res, formatCartResponse(cart));
  } catch (err) { next(err); }
};

/**
 * DELETE /cart/items/:itemId - Remove item from cart
 */
const removeItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ buyerId: req.userId });
    if (!cart) throw new AppError('Cart not found', 404, 'CART_NOT_FOUND');

    const targetId = String(req.params.itemId);
    const item = cart.items.find(
      (i) => i.productId?.toString() === targetId || i._id?.toString() === targetId
    );
    if (!item) throw new AppError('Item not in cart', 404, 'ITEM_NOT_FOUND');

    cart.items.pull(item._id);
    cart.version += 1;
    await cart.save();

    Event.create({ userId: req.userId, type: 'cart_remove', entityId: item.productId, entityType: 'product' }).catch(() => {});
    await cart.populate('items.productId', 'title images price status type sellerId');
    return success(res, formatCartResponse(cart));
  } catch (err) { next(err); }
};

/**
 * DELETE /cart - Clear entire cart
 */
const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ buyerId: req.userId }, { items: [], version: 0 });
    return success(res, { message: 'Cart cleared' });
  } catch (err) { next(err); }
};

/**
 * POST /cart/validate - Validate cart items are still available before checkout
 */
const validateCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ buyerId: req.userId });
    if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400, 'EMPTY_CART');

    const issues = [];
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product || product.status !== 'PUBLISHED') {
        issues.push({ itemId: item._id, issue: 'PRODUCT_UNAVAILABLE', productId: item.productId });
        continue;
      }

      const inv = await InventoryItem.findOne({ productId: item.productId, status: 'AVAILABLE' });
      if (!inv) {
        issues.push({ itemId: item._id, issue: 'OUT_OF_STOCK', productId: item.productId });
      } else if (product.type !== 'UNIQUE' && inv.quantity - inv.reserved < item.quantity) {
        issues.push({ itemId: item._id, issue: 'INSUFFICIENT_STOCK', available: inv.quantity - inv.reserved });
      }

      // Price change check
      const currentPrice = product.price.discountedAmount || product.price.amount;
      if (Math.abs(currentPrice - item.price) > 0.01) {
        issues.push({ itemId: item._id, issue: 'PRICE_CHANGED', oldPrice: item.price, newPrice: currentPrice });
        item.price = currentPrice;
      }
    }

    if (issues.length > 0) {
      await cart.save();
      return success(res, { valid: false, issues, cart });
    }

    return success(res, { valid: true, cart });
  } catch (err) { next(err); }
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, validateCart };
