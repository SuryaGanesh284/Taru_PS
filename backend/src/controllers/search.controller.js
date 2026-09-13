const Product = require('../models/Product');
const Event = require('../models/Event');
const { success, paginated } = require('../utils/response');

/**
 * GET /search - Full-text and filtered product search
 */
const search = async (req, res, next) => {
  try {
    const { q, category, type, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const filter = { status: 'PUBLISHED' };
    if (q) filter.$text = { $search: q };
    if (category) filter.categoryId = category;
    if (type) filter.type = type;
    if (minPrice || maxPrice) {
      filter['price.amount'] = {};
      if (minPrice) filter['price.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['price.amount'].$lte = parseFloat(maxPrice);
    }

    const sortMap = {
      relevance: q ? { score: { $meta: 'textScore' } } : { createdAt: -1 },
      newest: { createdAt: -1 },
      price_asc: { 'price.amount': 1 },
      price_desc: { 'price.amount': -1 },
      rating: { rating: -1 },
      popular: { totalSold: -1 },
    };

    const projection = q ? { score: { $meta: 'textScore' } } : {};
    const sortField = sortMap[sort] || sortMap[q ? 'relevance' : 'newest'];

    const [products, total] = await Promise.all([
      Product.find(filter, projection)
        .sort(sortField)
        .skip(skip)
        .limit(limitNum)
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'shgName location'),
      Product.countDocuments(filter),
    ]);

    // Track search event
    if (q && (req.user || req.query.sessionId)) {
      Event.create({
        userId: req.user?._id,
        sessionId: req.query.sessionId,
        type: 'search',
        entityType: 'search',
        metadata: { query: q, resultsCount: total, category, type },
      }).catch(() => {});
    }

    return paginated(res, products, { page: pageNum, limit: limitNum, total });
  } catch (err) { next(err); }
};

module.exports = { search };
