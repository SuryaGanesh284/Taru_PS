const Order = require('../models/Order');
const InventoryItem = require('../models/InventoryItem');
const Shipment = require('../models/Shipment');
const Invoice = require('../models/Invoice');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');

/**
 * GET /orders - List buyer's orders (or all orders for admin)
 */
const listOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = req.user.role === 'ADMIN' ? {} : { buyerId: req.userId };
    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    return paginated(res, orders, { page, limit, total });
  } catch (err) { next(err); }
};

/**
 * GET /orders/:orderId - Order details
 */
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('paymentId')
      .populate('shipmentId')
      .populate('invoiceId', 'invoiceNumber pdfUrl issuedAt');

    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    // Access control: buyer sees own orders, seller sees orders with their items, admin sees all
    const isOwner = order.buyerId.toString() === req.userId;
    const isAdmin = req.user.role === 'ADMIN';
    const isSeller = req.user.role === 'SELLER'; // Seller can view orders containing their products

    if (!isOwner && !isAdmin && !isSeller) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    return success(res, order);
  } catch (err) { next(err); }
};

/**
 * POST /orders/:orderId/cancel - Cancel an order
 */
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    const isOwner = order.buyerId.toString() === req.userId;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    // Only cancellable in certain states
    const cancellableStates = ['PENDING_PAYMENT', 'CONFIRMED'];
    if (!cancellableStates.includes(order.status)) {
      throw new AppError(`Cannot cancel order in ${order.status} state`, 409, 'INVALID_STATUS_TRANSITION');
    }

    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    order.cancellationReason = req.body.reason || 'Cancelled by user';
    await order.save();

    // Release reserved inventory
    for (const item of order.items) {
      if (item.inventoryItemId) {
        if (item.productType === 'UNIQUE') {
          await InventoryItem.findByIdAndUpdate(item.inventoryItemId, {
            status: 'AVAILABLE',
            reservationId: null,
            reservedAt: null,
          });
        } else {
          await InventoryItem.findByIdAndUpdate(item.inventoryItemId, {
            $inc: { reserved: -item.quantity },
          });
        }
      }
    }

    return success(res, order);
  } catch (err) { next(err); }
};

/**
 * GET /orders/:orderId/tracking - Shipment tracking timeline
 */
const getTracking = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('shipmentId');
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    const isOwner = order.buyerId.toString() === req.userId;
    if (!isOwner && req.user.role !== 'ADMIN' && req.user.role !== 'SELLER') {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    return success(res, order.shipmentId || { status: 'NOT_SHIPPED', events: [] });
  } catch (err) { next(err); }
};

/**
 * GET /orders/:orderId/invoice - Get invoice for order
 */
const getInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    const isOwner = order.buyerId.toString() === req.userId;
    if (!isOwner && req.user.role !== 'ADMIN') throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const invoice = await Invoice.findOne({ orderId: order._id });
    if (!invoice) throw new AppError('Invoice not generated yet', 404, 'INVOICE_NOT_FOUND');

    return success(res, invoice);
  } catch (err) { next(err); }
};

/**
 * POST /orders/:orderId/invoice/regenerate - Regenerate invoice (admin)
 */
const regenerateInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    if (order.paymentStatus !== 'PAID') throw new AppError('Invoice can only be generated for paid orders', 400, 'PAYMENT_REQUIRED');

    // Mark existing invoice as cancelled
    await Invoice.findOneAndUpdate({ orderId: order._id }, { status: 'CANCELLED' });

    // Create new invoice
    const invoice = await Invoice.create({
      orderId: order._id,
      buyerInfo: {
        name: order.shippingAddress.name,
        phone: order.shippingAddress.phone,
      },
      items: order.items.map((i) => ({
        description: i.title,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
      totals: order.pricing,
      status: 'ISSUED',
      issuedAt: new Date(),
    });

    order.invoiceId = invoice._id;
    await order.save();

    return success(res, invoice);
  } catch (err) { next(err); }
};

/**
  * POST /orders/:orderId/reorder - Add items from previous order to cart
  */
const reorder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    const isOwner = order.buyerId.toString() === req.userId;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    let cart = await Cart.findOne({ buyerId: req.userId });
    if (!cart) cart = await Cart.create({ buyerId: req.userId, items: [] });

    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product && product.status === 'PUBLISHED') {
        const existingIdx = cart.items.findIndex(
          (ci) => ci.productId.toString() === item.productId.toString()
        );
        const priceValue = typeof product.price === 'number'
          ? product.price
          : (product.price?.discountedAmount || product.price?.amount || 0);

        if (existingIdx >= 0) {
          cart.items[existingIdx].quantity += item.quantity || 1;
        } else {
          cart.items.push({
            productId: product._id,
            quantity: item.quantity || 1,
            price: priceValue,
            title: product.title,
            imageUrl: product.images?.find((i) => i.isPrimary)?.url || product.images?.[0]?.url,
            sellerId: product.sellerId,
          });
        }
      }
    }

    cart.version += 1;
    await cart.save();
    return success(res, { message: 'Items added to cart', cart });
  } catch (err) { next(err); }
};

module.exports = { listOrders, getOrder, cancelOrder, reorder, getTracking, getInvoice, regenerateInvoice };
