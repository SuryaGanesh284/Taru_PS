const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const AiRun = require('../models/AiRun');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');
const { audit } = require('../utils/audit');

/**
 * GET /admin/users - User management
 */
const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) filter.name = { $regex: req.query.q, $options: 'i' };

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return paginated(res, users, { page, limit, total });
  } catch (err) { next(err); }
};

/**
 * PATCH /admin/users/:userId/status - Suspend/activate user
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(status)) {
      throw new AppError('Invalid status', 400, 'INVALID_STATUS');
    }

    const user = await User.findByIdAndUpdate(req.params.userId, { status }, { new: true });
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    await audit({
      actorId: req.userId,
      actorRole: 'ADMIN',
      action: 'UPDATE_USER_STATUS',
      resource: 'User',
      resourceId: user._id,
      metadata: { status },
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    return success(res, user);
  } catch (err) { next(err); }
};

/**
 * GET /admin/sellers/pending - Pending seller verification
 */
const getPendingSellers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [sellers, total] = await Promise.all([
      SellerProfile.find({ verificationStatus: 'SUBMITTED' })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email phone'),
      SellerProfile.countDocuments({ verificationStatus: 'SUBMITTED' }),
    ]);

    return paginated(res, sellers, { page, limit, total });
  } catch (err) { next(err); }
};

/**
 * PATCH /admin/sellers/:sellerId/verification - Approve/reject seller
 */
const updateSellerVerification = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['VERIFIED', 'REJECTED'].includes(status)) throw new AppError('Invalid verification status', 400, 'INVALID_STATUS');

    const seller = await SellerProfile.findByIdAndUpdate(
      req.params.sellerId,
      {
        verificationStatus: status,
        verifiedAt: status === 'VERIFIED' ? new Date() : undefined,
        verifiedBy: status === 'VERIFIED' ? req.userId : undefined,
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
      },
      { new: true }
    ).populate('userId', 'name email');

    if (!seller) throw new AppError('Seller not found', 404, 'SELLER_NOT_FOUND');

    // Notify seller
    Notification.create({
      userId: seller.userId._id,
      type: 'SELLER_VERIFIED',
      title: status === 'VERIFIED' ? 'Account Verified!' : 'Verification Rejected',
      message: status === 'VERIFIED'
        ? 'Congratulations! Your seller account has been verified. You can now list products.'
        : `Your verification was rejected: ${rejectionReason}`,
      data: { sellerId: seller._id, status },
    }).catch(() => {});

    await audit({
      actorId: req.userId, actorRole: 'ADMIN',
      action: 'UPDATE_SELLER_VERIFICATION', resource: 'SellerProfile',
      resourceId: seller._id, metadata: { status, rejectionReason }, requestId: req.requestId,
    });

    return success(res, seller);
  } catch (err) { next(err); }
};

/**
 * GET /admin/products/pending - Products pending moderation
 */
const getPendingProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find({ status: 'PENDING_REVIEW' })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sellerId', 'shgName')
        .populate('categoryId', 'name'),
      Product.countDocuments({ status: 'PENDING_REVIEW' }),
    ]);

    return paginated(res, products, { page, limit, total });
  } catch (err) { next(err); }
};

/**
 * PATCH /admin/products/:productId/moderation - Approve/reject product
 */
const moderateProduct = async (req, res, next) => {
  try {
    const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'

    const status = action === 'approve' ? 'PUBLISHED' : 'REJECTED';
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { status, rejectionReason: status === 'REJECTED' ? rejectionReason : undefined },
      { new: true }
    ).populate('sellerId');

    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');

    // Notify seller
    Notification.create({
      userId: product.sellerId.userId,
      type: action === 'approve' ? 'PRODUCT_APPROVED' : 'PRODUCT_REJECTED',
      title: action === 'approve' ? 'Product Published' : 'Product Rejected',
      message: action === 'approve'
        ? `"${product.title}" is now live on the marketplace!`
        : `"${product.title}" was rejected: ${rejectionReason}`,
      data: { productId: product._id },
    }).catch(() => {});

    await audit({
      actorId: req.userId, actorRole: 'ADMIN',
      action: 'MODERATE_PRODUCT', resource: 'Product',
      resourceId: product._id, metadata: { action, status }, requestId: req.requestId,
    });

    return success(res, product);
  } catch (err) { next(err); }
};

/**
 * GET /admin/orders - All orders (global view)
 */
const listAllOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('buyerId', 'name email phone'),
      Order.countDocuments(filter),
    ]);

    return paginated(res, orders, { page, limit, total });
  } catch (err) { next(err); }
};

/**
 * POST /admin/refunds - Initiate refund
 */
const initiateRefund = async (req, res, next) => {
  try {
    const { orderId, amount, reason } = req.body;

    const payment = await Payment.findOne({ orderId });
    if (!payment) throw new AppError('Payment not found for this order', 404, 'PAYMENT_NOT_FOUND');
    if (payment.status !== 'PAID') throw new AppError('Can only refund paid orders', 409, 'INVALID_PAYMENT_STATUS');

    payment.refunds.push({ amount, reason, status: 'PENDING', createdAt: new Date() });
    payment.status = 'PARTIALLY_REFUNDED';
    await payment.save();

    const order = await Order.findByIdAndUpdate(orderId, { paymentStatus: 'PARTIALLY_REFUNDED' }, { new: true });

    await audit({
      actorId: req.userId, actorRole: 'ADMIN',
      action: 'INITIATE_REFUND', resource: 'Payment',
      resourceId: payment._id, metadata: { amount, reason, orderId }, requestId: req.requestId,
    });

    return success(res, { payment, order });
  } catch (err) { next(err); }
};

/**
 * GET /admin/audit-logs - Audit trail
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.actorId) filter.actorId = req.query.actorId;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.resource) filter.resource = req.query.resource;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit)
        .populate('actorId', 'name email role'),
      AuditLog.countDocuments(filter),
    ]);

    return paginated(res, logs, { page, limit, total });
  } catch (err) { next(err); }
};

/**
 * GET /admin/ai/runs - AI observability logs
 */
const getAiRuns = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.intent) filter.intent = req.query.intent;
    if (req.query.success !== undefined) filter.success = req.query.success === 'true';

    const [runs, total] = await Promise.all([
      AiRun.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AiRun.countDocuments(filter),
    ]);

    return paginated(res, runs, { page, limit, total });
  } catch (err) { next(err); }
};

/**
 * GET /admin/stats - Platform overview stats
 */
const getPlatformStats = async (req, res, next) => {
  try {
    const [
      totalUsers, totalSellers, totalProducts, totalOrders, totalRevenue,
      pendingVerifications, pendingProducts
    ] = await Promise.all([
      User.countDocuments(),
      SellerProfile.countDocuments({ verificationStatus: 'VERIFIED' }),
      Product.countDocuments({ status: 'PUBLISHED' }),
      Order.countDocuments(),
      Order.aggregate([{ $match: { paymentStatus: 'PAID' } }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
      SellerProfile.countDocuments({ verificationStatus: 'SUBMITTED' }),
      Product.countDocuments({ status: 'PENDING_REVIEW' }),
    ]);

    return success(res, {
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingVerifications,
      pendingProducts,
    });
  } catch (err) { next(err); }
};

module.exports = {
  listUsers, updateUserStatus,
  getPendingSellers, updateSellerVerification,
  getPendingProducts, moderateProduct,
  listAllOrders, initiateRefund,
  getAuditLogs, getAiRuns, getPlatformStats,
};
