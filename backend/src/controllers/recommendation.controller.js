const Recommendation = require('../models/Recommendation');
const Event = require('../models/Event');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

/**
 * GET /recommendations - Get personalized recommendations for the user
 */
const getRecommendations = async (req, res, next) => {
  try {
    const strategy = req.query.strategy || 'category_affinity';
    const limit = Math.min(20, parseInt(req.query.limit) || 10);

    // Guest fallback (or user not logged in)
    if (!req.userId) {
      const products = await Product.find({ status: 'PUBLISHED' })
        .sort({ rating: -1, totalSold: -1 })
        .limit(limit)
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'shgName location');

      return success(res, { items: products, resolvedItems: products });
    }

    // Check for cached recommendations
    const cached = await Recommendation.findOne({
      userId: req.userId,
      strategy,
      expiresAt: { $gt: new Date() },
    }).populate('items.productId', 'title images price rating sellerId');

    if (cached) {
      const items = cached.items.map((i) => i.productId).filter(Boolean);
      return success(res, { ...cached.toObject(), items, resolvedItems: items });
    }

    // Generate recommendations based on user behavior
    const recentEvents = await Event.find({ userId: req.userId, type: { $in: ['product_view', 'cart_add', 'purchase'] } })
      .sort({ timestamp: -1 })
      .limit(50);

    // Extract category preferences from events
    const productIds = recentEvents.map((e) => e.entityId).filter(Boolean);
    const viewedProducts = await Product.find({ _id: { $in: productIds } }).select('categoryId');
    const categoryCounts = {};
    viewedProducts.forEach((p) => {
      const catId = p.categoryId?.toString();
      if (catId) categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => id);

    // Find similar products the user hasn't seen
    const excludeIds = productIds;
    const query = {
      status: 'PUBLISHED',
      _id: { $nin: excludeIds },
    };
    if (topCategories.length > 0) query.categoryId = { $in: topCategories };

    const products = await Product.find(query)
      .sort({ rating: -1, totalSold: -1 })
      .limit(limit)
      .populate('sellerId', 'shgName location');

    const items = products.map((p) => ({
      productId: p._id,
      score: 1.0,
      reason: topCategories.length > 0 ? 'Based on your browsing history' : 'Popular in your region',
    }));

    // Cache for 1 hour
    const recommendation = await Recommendation.create({
      userId: req.userId,
      strategy,
      items,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    return success(res, { ...recommendation.toObject(), items: products, resolvedItems: products });
  } catch (err) { next(err); }
};

/**
 * POST /recommendations/feedback - Record feedback on a recommendation
 */
const recordFeedback = async (req, res, next) => {
  try {
    const { productId, action } = req.body; // action: 'clicked', 'dismissed', 'purchased'

    await Event.create({
      userId: req.userId,
      type: action === 'clicked' ? 'product_click' : 'product_view',
      entityId: productId,
      entityType: 'product',
      metadata: { source: 'recommendation', action },
    });

    return success(res, { recorded: true });
  } catch (err) { next(err); }
};

/**
 * POST /recommendations/generate - Force-generate new recommendations (admin/internal)
 */
const generateRecommendations = async (req, res, next) => {
  try {
    const { userId, strategy } = req.body;
    // Invalidate existing recommendations
    await Recommendation.deleteMany({ userId, strategy });
    return success(res, { message: 'Recommendation generation queued' });
  } catch (err) { next(err); }
};

module.exports = { getRecommendations, recordFeedback, generateRecommendations };
