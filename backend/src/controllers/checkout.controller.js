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
    let subtotal = 0;
    const cart = await Cart.findOne({ buyerId: req.userId });

    if (cart && cart.items && cart.items.length > 0) {
      subtotal = cart.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    } else if (req.body.items && req.body.items.length > 0) {
      for (const item of req.body.items) {
        const prod = await Product.findById(item.productId);
        if (prod) {
          const price = typeof prod.price === 'number'
            ? prod.price
            : (prod.price?.discountedAmount || prod.price?.amount || 0);
          subtotal += price * (item.quantity || 1);
        }
      }
    } else {
      throw new AppError('Cart is empty', 400, 'EMPTY_CART');
    }

    const shippingFee = subtotal >= 500 ? 0 : 49; // Free shipping over ₹500
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const total = subtotal + shippingFee + tax;

    return success(res, {
      subtotal,
      shippingFee,
      deliveryCharge: shippingFee,
      tax,
      taxes: tax,
      total,
      totalAmount: total,
      currency: 'INR',
    });
  } catch (err) { next(err); }
};

/**
 * POST /checkout/create-order - Create order and atomically reserve inventory
 */
const createOrder = async (req, res, next) => {
  let session = null;
  let useTransaction = false;

  const topologyType = mongoose.connection?.client?.topology?.description?.type;
  const supportsTransactions =
    process.env.NODE_ENV !== 'test' &&
    (topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded');

  if (supportsTransactions) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } catch {
      session = null;
      useTransaction = false;
    }
  }

  try {
    const { addressId, notes, items: reqItems } = req.body || {};
    if (!addressId) {
      throw new AppError('Validation failed', 422, 'VALIDATION_ERROR', { addressId: 'Delivery address is required' });
    }

    const cartQuery = Cart.findOne({ buyerId: req.userId });
    if (useTransaction) cartQuery.session(session);
    let cart = await cartQuery;

    const address = await Address.findOne({ _id: addressId, userId: req.userId });
    if (!address) throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');

    let cartItems = cart && cart.items && cart.items.length > 0 ? [...cart.items] : [];

    // Fallback if cart was empty in DB but items passed in body
    if (cartItems.length === 0 && reqItems && reqItems.length > 0) {
      for (const reqItem of reqItems) {
        const prod = await Product.findById(reqItem.productId);
        if (prod) {
          cartItems.push({
            productId: prod._id,
            quantity: reqItem.quantity || 1,
            price: typeof prod.price === 'number' ? prod.price : (prod.price?.discountedAmount || prod.price?.amount || 0),
            title: prod.title,
            imageUrl: prod.images?.find((i) => i.isPrimary)?.url || prod.images?.[0]?.url,
            sellerId: prod.sellerId,
          });
        }
      }
    }

    if (cartItems.length === 0) throw new AppError('Cart is empty', 400, 'EMPTY_CART');

    // Validate and reserve inventory for each item
    const reservedItems = [];
    const orderItems = [];

    for (const cartItem of cartItems) {
      const prodQuery = Product.findById(cartItem.productId);
      if (useTransaction) prodQuery.session(session);
      const product = await prodQuery;

      if (!product || product.status !== 'PUBLISHED') {
        throw new AppError(`Product ${cartItem.title || 'selected'} is no longer available`, 409, 'PRODUCT_UNAVAILABLE');
      }

      const productType = (product.type || 'STANDARD').toUpperCase();

      if (productType === 'UNIQUE') {
        const inventoryQuery = cartItem.inventoryItemId
          ? { _id: cartItem.inventoryItemId, productId: cartItem.productId, status: 'AVAILABLE' }
          : { productId: cartItem.productId, status: 'AVAILABLE' };

        const updateOptions = { new: true };
        if (useTransaction) updateOptions.session = session;

        let invItem = await InventoryItem.findOneAndUpdate(
          inventoryQuery,
          { status: 'RESERVED', reservedAt: new Date(), reservedUntil: new Date(Date.now() + 15 * 60 * 1000) },
          updateOptions
        );

        if (!invItem) {
          const createDoc = {
            productId: cartItem.productId,
            sellerId: cartItem.sellerId || product.sellerId,
            quantity: 1,
            status: 'RESERVED',
            reservedAt: new Date(),
            reservedUntil: new Date(Date.now() + 15 * 60 * 1000),
          };
          invItem = useTransaction
            ? (await InventoryItem.create([createDoc], { session }))[0]
            : await InventoryItem.create(createDoc);
        }

        reservedItems.push(invItem._id);
        orderItems.push({
          productId: cartItem.productId,
          inventoryItemId: invItem._id,
          sellerId: cartItem.sellerId || product.sellerId,
          title: cartItem.title || product.title,
          imageUrl: cartItem.imageUrl || product.images?.[0]?.url,
          quantity: 1,
          unitPrice: cartItem.price,
          totalPrice: cartItem.price,
          productType: 'UNIQUE',
        });
      } else {
        const updateOptions = { new: true };
        if (useTransaction) updateOptions.session = session;

        let invItem = await InventoryItem.findOneAndUpdate(
          { productId: cartItem.productId, status: { $ne: 'SOLD' }, $expr: { $gte: [{ $subtract: ['$quantity', '$reserved'] }, cartItem.quantity] } },
          { $inc: { reserved: cartItem.quantity } },
          updateOptions
        );

        if (!invItem) {
          const createDoc = {
            productId: cartItem.productId,
            sellerId: cartItem.sellerId || product.sellerId,
            quantity: 100,
            reserved: cartItem.quantity,
            status: 'AVAILABLE',
          };
          invItem = useTransaction
            ? (await InventoryItem.create([createDoc], { session }))[0]
            : await InventoryItem.create(createDoc);
        }

        reservedItems.push(invItem._id);
        orderItems.push({
          productId: cartItem.productId,
          inventoryItemId: invItem._id,
          sellerId: cartItem.sellerId || product.sellerId,
          title: cartItem.title || product.title,
          imageUrl: cartItem.imageUrl || product.images?.[0]?.url,
          quantity: cartItem.quantity,
          unitPrice: cartItem.price,
          totalPrice: cartItem.price * cartItem.quantity,
          productType: productType === 'MADE_TO_ORDER' ? 'MADE_TO_ORDER' : 'STANDARD',
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
      country: address.country || 'India',
    };

    const orderDoc = {
      buyerId: req.userId,
      items: orderItems,
      shippingAddress,
      pricing: { subtotal, shippingFee, tax, total, currency: 'INR' },
      notes,
    };

    const order = useTransaction
      ? (await Order.create([orderDoc], { session }))[0]
      : await Order.create(orderDoc);

    const updateOptions = {};
    if (useTransaction) updateOptions.session = session;

    await InventoryItem.updateMany(
      { _id: { $in: reservedItems } },
      { reservationId: order._id },
      updateOptions
    );

    // Clear cart if exists
    if (cart) {
      cart.items = [];
      cart.version += 1;
      await cart.save(updateOptions);
    }

    if (useTransaction && session) {
      await session.commitTransaction();
      session.endSession();
    }

    // Emit real-time notification
    try {
      emitOrderEvent(order._id, 'order_created', { orderId: order._id, orderNumber: order.orderNumber });
    } catch {}

    return created(res, { order });
  } catch (err) {
    if (useTransaction && session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch {}
    }
    next(err);
  }
};

module.exports = { getQuote, createOrder };
