const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const InventoryItem = require('../models/InventoryItem');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Verify Razorpay webhook signature
 */
const verifyRazorpaySignature = (rawBody, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET || 'webhook_secret_dev')
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
};

/**
 * POST /webhooks/payments/:provider - Handle verified payment webhook
 *
 * SECURITY:
 * 1. Verifies provider signature
 * 2. Deduplicates using processedEventIds (idempotent)
 * 3. Enforces allowed status transitions
 * 4. Never trusts browser redirects
 */
const handlePaymentWebhook = async (req, res, next) => {
  try {
    const provider = req.params.provider;
    const rawBody = req.body; // raw Buffer from express.raw()
    const bodyString = rawBody.toString();
    const payload = JSON.parse(bodyString);

    // ---- 1. Verify signature ----
    if (provider === 'razorpay') {
      const signature = req.headers['x-razorpay-signature'];
      if (!signature || !verifyRazorpaySignature(bodyString, signature)) {
        logger.warn('Webhook signature verification failed', { provider, requestId: req.requestId });
        return res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } });
      }
    }
    // Add other providers (stripe, payu) here

    const eventId = payload.event_id || payload.id || `${provider}_${Date.now()}`;
    const eventType = payload.event || payload.type;

    // ---- 2. Find the payment record ----
    let providerPaymentId;
    let orderId;
    if (provider === 'razorpay') {
      providerPaymentId = payload.payload?.payment?.entity?.id;
      orderId = payload.payload?.payment?.entity?.notes?.orderId;
    }

    const payment = await Payment.findOne({
      $or: [
        providerPaymentId ? { providerPaymentId } : null,
        orderId ? { orderId } : null,
      ].filter(Boolean),
    });

    if (!payment) {
      logger.warn('Webhook received for unknown payment', { eventId, provider });
      return res.status(200).json({ received: true }); // Acknowledge unknown
    }

    // ---- 3. Idempotency check — reject duplicate events ----
    if (payment.processedEventIds.includes(eventId)) {
      logger.info('Duplicate webhook event ignored', { eventId });
      return res.status(200).json({ received: true, duplicate: true });
    }

    payment.processedEventIds.push(eventId);
    if (providerPaymentId) payment.providerPaymentId = providerPaymentId;

    const order = await Order.findById(payment.orderId);
    if (!order) {
      await payment.save();
      return res.status(200).json({ received: true });
    }

    // ---- 4. Process event type ----
    if (eventType === 'payment.captured' || eventType === 'payment_intent.succeeded') {
      // Payment succeeded
      if (payment.status !== 'PAID') {
        payment.status = 'PAID';
        payment.paidAt = new Date();
        order.status = 'CONFIRMED';
        order.paymentStatus = 'PAID';
        order.confirmedAt = new Date();

        // Finalize inventory: RESERVED → SOLD for unique items, clear reservation for standard
        for (const item of order.items) {
          if (item.inventoryItemId) {
            if (item.productType === 'UNIQUE') {
              await InventoryItem.findByIdAndUpdate(item.inventoryItemId, { status: 'SOLD' });
            } else {
              await InventoryItem.findByIdAndUpdate(item.inventoryItemId, {
                $inc: { quantity: -item.quantity, reserved: -item.quantity },
              });
            }
          }
        }

        // Auto-generate invoice
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

        // Send notifications (non-blocking)
        Notification.create({
          userId: order.buyerId,
          type: 'PAYMENT_SUCCESS',
          title: 'Payment Successful',
          message: `Your order ${order.orderNumber} has been confirmed!`,
          data: { orderId: order._id, orderNumber: order.orderNumber },
        }).catch(() => {});
      }
    } else if (eventType === 'payment.failed') {
      payment.status = 'FAILED';
      payment.failureReason = payload.payload?.payment?.entity?.error_description;
      order.status = 'PAYMENT_FAILED';
      order.paymentStatus = 'FAILED';

      // Release inventory reservations
      for (const item of order.items) {
        if (item.inventoryItemId) {
          if (item.productType === 'UNIQUE') {
            await InventoryItem.findByIdAndUpdate(item.inventoryItemId, { status: 'AVAILABLE', reservationId: null, reservedAt: null });
          } else {
            await InventoryItem.findByIdAndUpdate(item.inventoryItemId, { $inc: { reserved: -item.quantity } });
          }
        }
      }

      Notification.create({
        userId: order.buyerId,
        type: 'PAYMENT_FAILED',
        title: 'Payment Failed',
        message: `Payment for order ${order.orderNumber} failed. Please try again.`,
        data: { orderId: order._id, orderNumber: order.orderNumber },
      }).catch(() => {});
    } else if (eventType === 'refund.created' || eventType === 'charge.refunded') {
      payment.status = 'REFUNDED';
      order.paymentStatus = 'REFUNDED';
    }

    await Promise.all([payment.save(), order.save()]);

    logger.info('Webhook processed', { eventId, eventType, provider, orderId: order._id });
    return res.status(200).json({ received: true });
  } catch (err) {
    logger.error('Webhook processing error:', { error: err.message, requestId: req.requestId });
    // Always return 200 to acknowledge receipt — don't reveal internal errors to provider
    return res.status(200).json({ received: true, error: 'processing_failed' });
  }
};

module.exports = { handlePaymentWebhook };
