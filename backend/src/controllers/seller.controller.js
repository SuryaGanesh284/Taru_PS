const mongoose = require('mongoose');
const SellerProfile = require('../models/SellerProfile');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Shipment = require('../models/Shipment');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');
const { success, created, paginated } = require('../utils/response');
const { audit } = require('../utils/audit');
const { emitOrderEvent, emitToUser } = require('../sockets');

/**
 * POST /sellers/profile - Create SHG seller profile
 */
const createProfile = async (req, res, next) => {
  try {
    const existing = await SellerProfile.findOne({ userId: req.userId });
    if (existing) throw new AppError('Seller profile already exists', 409, 'PROFILE_EXISTS');

    const profile = await SellerProfile.create({ userId: req.userId, ...req.body });

    // Update user role to SELLER
    await User.findByIdAndUpdate(req.userId, { role: 'SELLER' });

    return created(res, profile);
  } catch (err) { next(err); }
};

/**
 * GET /sellers/me - Current seller's profile
 */
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile) throw new AppError('Seller profile not found', 404, 'PROFILE_NOT_FOUND');
    return success(res, profile);
  } catch (err) { next(err); }
};

/**
 * PATCH /sellers/me - Update seller profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['shgName', 'description', 'location', 'contactPhone', 'contactEmail', 'logoUrl', 'bannerUrl'];
    const updates = {};
    allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

    const profile = await SellerProfile.findOneAndUpdate({ userId: req.userId }, updates, { new: true, runValidators: true });
    if (!profile) throw new AppError('Seller profile not found', 404, 'PROFILE_NOT_FOUND');

    return success(res, profile);
  } catch (err) { next(err); }
};

/**
 * POST /sellers/me/verification - Submit verification documents
 */
const submitVerification = async (req, res, next) => {
  try {
    const { documents } = req.body;
    const profile = await SellerProfile.findOneAndUpdate(
      { userId: req.userId },
      { verificationDocuments: documents, verificationStatus: 'SUBMITTED' },
      { new: true }
    );
    if (!profile) throw new AppError('Seller profile not found', 404, 'PROFILE_NOT_FOUND');
    return success(res, profile);
  } catch (err) { next(err); }
};

/**
 * GET /sellers/:sellerId - Public seller profile
 */
const getPublicProfile = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      throw new AppError('Seller not found', 404, 'SELLER_NOT_FOUND');
    }
    const profile = await SellerProfile.findById(sellerId)
      .populate('userId', 'name avatarUrl')
      .select('-verificationDocuments');
    if (!profile || !profile.isActive) throw new AppError('Seller not found', 404, 'SELLER_NOT_FOUND');
    return success(res, profile);
  } catch (err) { next(err); }
};

/**
 * GET /sellers/me/dashboard - Seller dashboard stats
 */
const getDashboard = async (req, res, next) => {
  try {
    let profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile) {
      const user = await User.findById(req.userId);
      if (user && (user.role === 'SELLER' || user.role === 'ADMIN')) {
        profile = await SellerProfile.create({
          userId: user._id,
          shgName: user.name || 'My SHG',
        });
      } else {
        throw new AppError('Seller profile not found', 404, 'PROFILE_NOT_FOUND');
      }
    }

    const [totalProducts, activeProducts, pendingOrders, totalRevenueAgg, totalOrdersCount, recentOrders] = await Promise.all([
      Product.countDocuments({ sellerId: profile._id }),
      Product.countDocuments({ sellerId: profile._id, status: 'PUBLISHED' }),
      Order.countDocuments({ 'items.sellerId': profile._id, status: { $in: ['CONFIRMED', 'PROCESSING'] } }),
      Order.aggregate([
        { $match: { 'items.sellerId': profile._id, paymentStatus: 'PAID' } },
        { $unwind: '$items' },
        { $match: { 'items.sellerId': profile._id } },
        { $group: { _id: null, total: { $sum: '$items.totalPrice' } } },
      ]),
      Order.countDocuments({ 'items.sellerId': profile._id }),
      Order.find({ 'items.sellerId': profile._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('buyerId', 'name email'),
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;
    const formattedRecentOrders = recentOrders.map((o) => ({
      _id: o._id.toString(),
      buyer: { name: o.buyerId?.name || o.shippingAddress?.name || 'Customer' },
      createdAt: o.createdAt,
      pricing: o.pricing,
      totals: o.pricing,
      status: o.status,
    }));

    return success(res, {
      revenue: { total: totalRevenue, trend: '+15%' },
      orders: { total: totalOrdersCount, pending: pendingOrders, trend: '+10%' },
      products: { active: activeProducts, total: totalProducts },
      rating: { average: profile.rating || 0, total: profile.totalReviews || 0 },
      recentOrders: formattedRecentOrders,
      totalProducts: activeProducts,
      pendingOrders,
      totalRevenue,
      rating: profile.rating || 0,
      totalReviews: profile.totalReviews || 0,
      verificationStatus: profile.verificationStatus,
    });
  } catch (err) { next(err); }
};

/**
 * GET /sellers/me/products - Seller's own products
 */
const getMyProducts = async (req, res, next) => {
  try {
    let profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(200).json({
        data: [],
        products: [],
        items: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false },
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = { sellerId: profile._id };
    if (req.query.status) filter.status = req.query.status;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      data: products,
      products,
      items: products,
      meta: {
        requestId: res.req?.requestId,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (err) { next(err); }
};

/**
 * GET /sellers/me/orders - Seller's orders
 */
const getMyOrders = async (req, res, next) => {
  try {
    let profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(200).json({
        data: [],
        orders: [],
        items: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false },
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = { 'items.sellerId': profile._id };
    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('buyerId', 'name email phone'),
      Order.countDocuments(filter),
    ]);

    const formattedOrders = orders.map((o) => {
      const doc = o.toObject ? o.toObject() : { ...o };
      doc.buyer = doc.buyerId;
      doc.totals = doc.pricing;
      return doc;
    });

    return res.status(200).json({
      data: formattedOrders,
      orders: formattedOrders,
      items: formattedOrders,
      meta: {
        requestId: res.req?.requestId,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (err) { next(err); }
};

/**
 * GET /sellers/me/analytics - Seller analytics
 */
const getAnalytics = async (req, res, next) => {
  try {
    let profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile) {
      return success(res, {
        revenue: { total: 0, monthlyGrowth: '+0%' },
        orders: { total: 0, monthlyGrowth: '+0%' },
        buyers: { unique: 0 },
        rating: { average: 0, total: 0 },
        monthlyRevenue: [],
        topProducts: [],
        salesByDay: [],
        categoryBreakdown: [],
      });
    }

    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalRevenueAgg,
      totalOrdersCount,
      uniqueBuyersAgg,
      recentProducts,
      salesByDay,
      categoryBreakdown,
      monthlyRevenueAgg,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { 'items.sellerId': profile._id, paymentStatus: 'PAID' } },
        { $unwind: '$items' },
        { $match: { 'items.sellerId': profile._id } },
        { $group: { _id: null, total: { $sum: '$items.totalPrice' } } },
      ]),
      Order.countDocuments({ 'items.sellerId': profile._id }),
      Order.distinct('buyerId', { 'items.sellerId': profile._id }),
      Product.find({ sellerId: profile._id })
        .sort({ totalSold: -1, createdAt: -1 })
        .limit(5)
        .select('title images totalSold price'),
      Order.aggregate([
        { $match: { 'items.sellerId': profile._id, createdAt: { $gte: since }, paymentStatus: 'PAID' } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { 'items.sellerId': profile._id, paymentStatus: 'PAID' } },
        { $unwind: '$items' },
        { $match: { 'items.sellerId': profile._id } },
        { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $group: { _id: '$product.categoryId', count: { $sum: '$items.quantity' }, revenue: { $sum: '$items.totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { 'items.sellerId': profile._id, paymentStatus: 'PAID' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$pricing.total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]),
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;
    const topProducts = recentProducts.map((p) => ({
      product: {
        _id: p._id,
        title: p.title,
        images: p.images || [],
      },
      soldCount: p.totalSold || 0,
      revenue: (p.totalSold || 0) * (typeof p.price === 'number' ? p.price : (p.price?.amount || 0)),
    }));

    const monthlyRevenue = monthlyRevenueAgg.map((m) => ({
      month: m._id,
      revenue: m.revenue,
      orders: m.orders,
    }));

    return success(res, {
      revenue: { total: totalRevenue, monthlyGrowth: '+12%' },
      orders: { total: totalOrdersCount, monthlyGrowth: '+8%' },
      buyers: { unique: uniqueBuyersAgg.length },
      rating: { average: profile.rating || 0, total: profile.totalReviews || 0 },
      monthlyRevenue,
      topProducts,
      salesByDay,
      categoryBreakdown,
    });
  } catch (err) { next(err); }
};

/**
 * GET /sellers/me/orders/:orderId - Get single order for seller
 */
const getMyOrder = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile) throw new AppError('Seller profile not found', 404, 'PROFILE_NOT_FOUND');

    const order = await Order.findOne({ _id: req.params.orderId, 'items.sellerId': profile._id })
      .populate('buyerId', 'name email phone')
      .populate('items.productId', 'title images price status type')
      .populate('shipmentId');

    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    const doc = order.toObject ? order.toObject() : { ...order };
    doc.buyer = doc.buyerId;
    doc.totals = doc.pricing;

    return success(res, doc);
  } catch (err) { next(err); }
};

/**
 * PATCH /sellers/me/orders/:orderId/status - Update order status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) throw new AppError('Status is required', 400, 'MISSING_STATUS');

    const profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile) throw new AppError('Seller profile not found', 404, 'PROFILE_NOT_FOUND');

    const order = await Order.findOne({ _id: req.params.orderId, 'items.sellerId': profile._id });
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    order.status = status;
    if (status === 'DELIVERED') order.deliveredAt = new Date();
    await order.save();

    emitOrderEvent(order._id, 'order:status', { orderId: order._id, status });
    emitToUser(order.buyerId, 'order:updated', { orderId: order._id, status });

    Notification.create({
      userId: order.buyerId,
      type: `ORDER_${status}`,
      title: `Order #${order._id.toString().slice(-6).toUpperCase()} ${status}`,
      message: `Your order status has been updated to ${status}.`,
      data: { orderId: order._id, status },
    }).catch(() => {});

    return success(res, order);
  } catch (err) { next(err); }
};

/**
 * POST /sellers/me/orders/:orderId/ship - Ship order
 */
const shipOrder = async (req, res, next) => {
  try {
    const { trackingNumber, carrier = 'Standard Shipping', trackingUrl } = req.body;
    if (!trackingNumber) throw new AppError('Tracking number is required', 400, 'MISSING_TRACKING_NUMBER');

    const profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile) throw new AppError('Seller profile not found', 404, 'PROFILE_NOT_FOUND');

    const order = await Order.findOne({ _id: req.params.orderId, 'items.sellerId': profile._id });
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    const shipment = await Shipment.create({
      orderId: order._id,
      carrier,
      trackingNumber,
      trackingUrl,
      status: 'AWAITING_PICKUP',
      events: [
        { status: 'AWAITING_PICKUP', description: `Shipment created with tracking number ${trackingNumber}`, timestamp: new Date() },
      ],
    });

    order.shipmentId = shipment._id;
    order.status = 'SHIPPED';
    await order.save();

    emitOrderEvent(order._id, 'order:status', { orderId: order._id, status: 'SHIPPED', shipment });
    emitToUser(order.buyerId, 'order:updated', { orderId: order._id, status: 'SHIPPED', trackingNumber });

    Notification.create({
      userId: order.buyerId,
      type: 'ORDER_SHIPPED',
      title: 'Order Shipped!',
      message: `Your order has been shipped via ${carrier}. Tracking: ${trackingNumber}`,
      data: { orderId: order._id, shipmentId: shipment._id, trackingNumber },
    }).catch(() => {});

    return success(res, { order, shipment });
  } catch (err) { next(err); }
};

module.exports = {
  createProfile, getMyProfile, updateProfile, submitVerification,
  getPublicProfile, getDashboard, getMyProducts, getMyOrders, getAnalytics,
  getMyOrder, updateOrderStatus, shipOrder,
};
