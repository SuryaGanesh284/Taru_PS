const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

/**
 * GET /shipments/:shipmentId - Get shipment details
 */
const getShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.shipmentId).populate('orderId', 'buyerId orderNumber');
    if (!shipment) throw new AppError('Shipment not found', 404, 'SHIPMENT_NOT_FOUND');

    const order = shipment.orderId;
    const isOwner = order.buyerId.toString() === req.userId;
    if (!isOwner && req.user.role !== 'ADMIN' && req.user.role !== 'SELLER') {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    return success(res, shipment);
  } catch (err) { next(err); }
};

/**
 * POST /shipments/:shipmentId/events - Add tracking event (Admin/logistics)
 */
const addTrackingEvent = async (req, res, next) => {
  try {
    const { status, description, location } = req.body;
    if (!status) throw new AppError('Status is required', 400, 'MISSING_STATUS');

    const shipment = await Shipment.findById(req.params.shipmentId).populate('orderId');
    if (!shipment) throw new AppError('Shipment not found', 404, 'SHIPMENT_NOT_FOUND');

    shipment.events.push({ status, description, location, timestamp: new Date() });
    shipment.status = status;

    if (status === 'DELIVERED') {
      shipment.deliveredAt = new Date();
      const order = await Order.findByIdAndUpdate(
        shipment.orderId._id,
        { status: 'DELIVERED', deliveredAt: new Date() },
        { new: true }
      );

      // Notify buyer
      Notification.create({
        userId: order.buyerId,
        type: 'ORDER_DELIVERED',
        title: 'Order Delivered',
        message: `Your order ${order.orderNumber} has been delivered!`,
        data: { orderId: order._id, shipmentId: shipment._id },
      }).catch(() => {});
    }

    await shipment.save();
    return success(res, shipment);
  } catch (err) { next(err); }
};

/**
 * POST /shipments - Create shipment for an order (Admin/Seller)
 */
const createShipment = async (req, res, next) => {
  try {
    const { orderId, carrier, trackingNumber, trackingUrl, estimatedDeliveryDate } = req.body;

    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    if (order.status !== 'CONFIRMED' && order.status !== 'PROCESSING') {
      throw new AppError('Order is not ready for shipment', 409, 'INVALID_ORDER_STATUS');
    }

    const shipment = await Shipment.create({
      orderId,
      carrier,
      trackingNumber,
      trackingUrl,
      estimatedDeliveryDate,
      status: 'AWAITING_PICKUP',
      events: [{ status: 'AWAITING_PICKUP', description: 'Shipment created', timestamp: new Date() }],
    });

    order.shipmentId = shipment._id;
    order.status = 'SHIPPED';
    await order.save();

    Notification.create({
      userId: order.buyerId,
      type: 'ORDER_SHIPPED',
      title: 'Order Shipped',
      message: `Your order ${order.orderNumber} has been shipped via ${carrier}. Tracking: ${trackingNumber}`,
      data: { orderId: order._id, shipmentId: shipment._id, trackingNumber },
    }).catch(() => {});

    return success(res, shipment);
  } catch (err) { next(err); }
};

module.exports = { getShipment, addTrackingEvent, createShipment };
