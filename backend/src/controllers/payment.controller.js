const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { AppError } = require('../middleware/errorHandler');
const { success, created } = require('../utils/response');
const rateLimiter = require('../middleware/rateLimiter');

/**
 * POST /payments/create-intent - Create a payment intent for an order
 * Returns the provider-specific data needed for client-side payment UI
 */
const createIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId) throw new AppError('Order ID is required', 400, 'MISSING_ORDER_ID');

    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    if (order.buyerId.toString() !== req.userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    if (order.status !== 'PENDING_PAYMENT') throw new AppError('Order is not awaiting payment', 409, 'INVALID_ORDER_STATUS');

    // Create payment record
    const payment = await Payment.create({
      orderId: order._id,
      provider: process.env.PAYMENT_PROVIDER || 'razorpay',
      amount: order.pricing.total,
      currency: order.pricing.currency,
    });

    order.paymentId = payment._id;
    await order.save();

    // In a real implementation, call the payment provider SDK here
    // For now, return mock data structure
    const intentData = {
      paymentId: payment._id,
      paymentIntentId: payment._id,
      paymentUrl: null,
      provider: payment.provider,
      amount: payment.amount,
      currency: payment.currency,
      orderId: order._id,
      orderNumber: order.orderNumber,
      // Provider-specific fields would go here:
      // razorpay: { razorpayOrderId, key }
      // stripe: { clientSecret }
    };

    return created(res, intentData);
  } catch (err) { next(err); }
};

/**
 * GET /payments/:paymentId/status - Get payment status
 */
const getPaymentStatus = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId).populate('orderId', 'buyerId orderNumber status');
    if (!payment) throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');

    const order = payment.orderId;
    if (order.buyerId.toString() !== req.userId && req.user.role !== 'ADMIN') {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    return success(res, {
      paymentId: payment._id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      paidAt: payment.paidAt,
      orderNumber: order.orderNumber,
    });
  } catch (err) { next(err); }
};

module.exports = { createIntent, getPaymentStatus };
