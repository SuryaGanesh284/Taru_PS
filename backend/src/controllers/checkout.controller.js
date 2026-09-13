const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const InventoryItem = require('../models/InventoryItem');
const Address = require('../models/Address');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');
const { success, created } = require('../utils/response');
const { emitOrderEvent } = require('../sockets');

/**
 * POST /checkout/quote - Get a price quote for the cart (shipping estimate, totals)
 */
const getQuote = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ buyerId: req.userId });
    if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400, 'EMPTY_CART');

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = subtotal >= 500 ? 0 : 49; // Free shipping over ₹500
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const total = subtotal + shippingFee + tax;

    return success(res, { subtotal, shippingFee, tax, total, currency: 'INR' });
  } catch (err) { next(err); }
};

/**
 * POST /checkout/create-order - Create order and atomically reserve inventory
 * This is the most critical endpoint — handles unique item concurrency-safe reservation
 */
const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { addressId, notes } = req.body;

    const [cart, address] = await Promise.all([
      Cart.findOne({ buyerId: req.userId }).session(session),
      Address.findOne({ _id: addressId, userId: req.userId }),
    ]);

    if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400, 'EMPTY_CART');
    if (!address) throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');

    // Validate and reserve inventory for each item
    const reservedItems = [];
    const orderItems = [];

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.productId).session(session);
      if (!product || product.status !== 'PUBLISHED') {
        throw new AppError(`Product ${cartItem.title} is no longer available`, 409, 'PRODUCT_UNAVAILABLE');
      }

      if (product.type === 'UNIQUE') {
        // *** Concurrency-safe atomic reservation for unique items ***
        const inventoryQuery = cartItem.inventoryItemId
          ? { _id: cartItem.inventoryItemId, productId: cartItem.productId, status: 'AVAILABLE' }
          : { productId: cartItem.productId, status: 'AVAILABLE' };

        const invItem = await InventoryItem.findOneAndUpdate(
          inventoryQuery,
          { status: 'RESERVED', reservedAt: new Date(), reservedUntil: new Date(Date.now() + 15 * 60 * 1000) },
          { new: true, session }
        );

        if (!invItem) {
          throw new AppError(
            `"${cartItem.title}" is no longer available — it was just purchased by another buyer.`,
            409,
            'UNIQUE_ITEM_UNAVAILABLE'
          );
        }
        reservedItems.push(invItem._id);
        orderItems.push({
          productId: cartItem.productId,
          inventoryItemId: invItem._id,
          sellerId: cartItem.sellerId,
          title: cartItem.title,
          imageUrl: cartItem.imageUrl,
          quantity: 1,
          unitPrice: cartItem.price,
          totalPrice: cartItem.price,
          productType: 'UNIQUE',
        });
      } else {
        // Standard/Made-to-order: decrement reserved quantity
        const invItem = await InventoryItem.findOneAndUpdate(
          { productId: cartItem.productId, status: { $ne: 'SOLD' }, $expr: { $gte: [{ $subtract: ['$quantity', '$reserved'] }, cartItem.quantity] } },
          { $inc: { reserved: cartItem.quantity } },
          { new: true, session }
        );

        if (!invItem) throw new AppError(`Insufficient stock for ${cartItem.title}`, 409, 'INSUFFICIENT_STOCK');
        reservedItems.push(invItem._id);
        orderItems.push({
          productId: cartItem.productId,
          inventoryItemId: invItem._id,
          sellerId: cartItem.sellerId,
          title: cartItem.title,
          imageUrl: cartItem.imageUrl,
          quantity: cartItem.quantity,
          unitPrice: cartItem.price,
          totalPrice: cartItem.price * cartItem.quantity,
          productType: product.type,
        });
      }
    }

    // Calculate totals
    const subtotal = orderItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const shippingFee = subtotal >= 500 ? 0 : 49;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shippingFee + tax;

    const shippingAddress = {
      name: address.name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
    };

    // Create order
    const [order] = await Order.create([{
      buyerId: req.userId,
      items: orderItems,
      shippingAddress,
      pricing: { subtotal, shippingFee, tax, total, currency: 'INR' },
      notes,
    }], { session });

    // Update inventory reservationId
    await InventoryItem.updateMany(
      { _id: { $in: reservedItems } },
      { reservationId: order._id },
      { session }
    );

    // Clear cart
    cart.items = [];
    cart.version += 1;
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    return created(res, order);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

module.exports = { getQuote, createOrder };
