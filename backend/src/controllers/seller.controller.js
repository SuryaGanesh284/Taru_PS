const SellerProfile = require('../models/SellerProfile');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { AppError } = require('../middleware/errorHandler');
const { success, created, paginated } = require('../utils/response');
const { audit } = require('../utils/audit');

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
    const profile = await SellerProfile.findById(req.params.sellerId)
      .populate('userId', 'name avatarUrl')
      .select('-bankAccount -verificationDocuments');
    if (!profile || !profile.isActive) throw new AppError('Seller not found', 404, 'SELLER_NOT_FOUND');
    return success(res, profile);
  } catch (err) { next(err); }
};

/**
 * GET /sellers/me/dashboard - Seller dashboard stats
 */
const getDashboard = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile) throw new AppError('Seller profile not found', 404, 'PROFILE_NOT_FOUND');

    const [totalProducts, pendingOrders, totalRevenue] = await Promise.all([
      Product.countDocuments({ sellerId: profile._id, status: 'PUBLISHED' }),
      Order.countDocuments({ 'items.sellerId': profile._id, status: { $in: ['CONFIRMED', 'PROCESSING'] } }),
      Order.aggregate([
        { $match: { 'items.sellerId': profile._id, paymentStatus: 'PAID' } },
        { $unwind: '$items' },
        { $match: { 'items.sellerId': profile._id } },
        { $group: { _id: null, total: { $sum: '$items.totalPrice' } } },
      ]),
    ]);

    return success(res, {
      totalProducts,
      pendingOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      rating: profile.rating,
      totalReviews: profile.totalReviews,
      verificationStatus: profile.verificationStatus,
    });
  } catch (err) { next(err); }
};

/**
 * GET /sellers/me/products - Seller's own products
 */
const getMyProducts = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile) throw new AppError('Seller profile not found', 404, 'PROFILE_NOT_FOUND');

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = { sellerId: profile._id };
    if (req.query.status) filter.status = req.query.status;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    return paginated(res, products, { page, limit, total });
  } catch (err) { next(err); }
};

/**
 * GET /sellers/me/orders - Seller's orders
 */
const getMyOrders = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile) throw new AppError('Seller profile not found', 404, 'PROFILE_NOT_FOUND');

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = { 'items.sellerId': profile._id };
    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('buyerId', 'name email phone'),
      Order.countDocuments(filter),
    ]);

    return paginated(res, orders, { page, limit, total });
  } catch (err) { next(err); }
};

/**
 * GET /sellers/me/analytics - Seller analytics
 */
const getAnalytics = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile) throw new AppError('Seller profile not found', 404, 'PROFILE_NOT_FOUND');

    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [topProducts, salesByDay, categoryBreakdown] = await Promise.all([
      Product.find({ sellerId: profile._id, status: 'PUBLISHED' })
        .sort({ totalSold: -1, viewCount: -1 })
        .limit(5)
        .select('title totalSold viewCount rating'),
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
    ]);

    return success(res, { topProducts, salesByDay, categoryBreakdown });
  } catch (err) { next(err); }
};

module.exports = {
  createProfile, getMyProfile, updateProfile, submitVerification,
  getPublicProfile, getDashboard, getMyProducts, getMyOrders, getAnalytics,
};
