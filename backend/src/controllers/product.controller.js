const Product = require('../models/Product');
const SellerProfile = require('../models/SellerProfile');
const InventoryItem = require('../models/InventoryItem');
const Event = require('../models/Event');
const { AppError } = require('../middleware/errorHandler');
const { success, created, paginated } = require('../utils/response');

/**
 * GET /products - Catalog list/search with filters and pagination
 */
const listProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = { status: 'PUBLISHED' };

    if (req.query.category) filter.categoryId = req.query.category;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.seller) filter.sellerId = req.query.seller;
    if (req.query.minPrice) filter['price.amount'] = { $gte: parseFloat(req.query.minPrice) };
    if (req.query.maxPrice) filter['price.amount'] = { ...filter['price.amount'], $lte: parseFloat(req.query.maxPrice) };
    if (req.query.q) filter.$text = { $search: req.query.q };

    const sortOptions = {
      newest: { createdAt: -1 },
      price_asc: { 'price.amount': 1 },
      price_desc: { 'price.amount': -1 },
      rating: { rating: -1 },
      popular: { totalSold: -1 },
    };
    const sort = sortOptions[req.query.sort] || sortOptions.newest;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'shgName location'),
      Product.countDocuments(filter),
    ]);

    return paginated(res, products, { page, limit, total });
  } catch (err) { next(err); }
};

/**
 * POST /products - Create product (Seller only)
 */
const createProduct = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile) throw new AppError('Seller profile required', 403, 'NO_SELLER_PROFILE');
    if (profile.verificationStatus !== 'VERIFIED' && process.env.NODE_ENV === 'production') {
      throw new AppError('Seller must be verified to list products', 403, 'SELLER_NOT_VERIFIED');
    }

    const payload = { ...req.body, sellerId: profile._id };
    if (typeof payload.price === 'number') {
      payload.price = { amount: payload.price, currency: 'INR' };
    }
    const stockQty = payload.initialStock !== undefined ? Number(payload.initialStock) : Number(payload.quantity || 0);

    const product = await Product.create(payload);

    // Create initial inventory item for the product
    if (payload.type === 'UNIQUE') {
      await InventoryItem.create({
        productId: product._id,
        sku: `${product._id}-UNIQUE-1`,
        uniqueItemId: `${product._id}-${Date.now()}`,
        quantity: 1,
        status: 'AVAILABLE',
      });
    } else {
      await InventoryItem.create({
        productId: product._id,
        sku: `${product._id}-STD-1`,
        quantity: stockQty,
      });
    }

    return created(res, product);
  } catch (err) { next(err); }
};

/**
 * GET /products/:productId - Product details
 */
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId)
      .populate('categoryId', 'name slug attributes')
      .populate('sellerId', 'shgName location rating totalReviews logoUrl');

    if (!product || (product.status !== 'PUBLISHED' && !req.user)) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // Track view event (non-blocking)
    if (req.user || req.query.sessionId) {
      Event.create({
        userId: req.user?._id,
        sessionId: req.query.sessionId,
        type: 'product_view',
        entityId: product._id,
        entityType: 'product',
        metadata: { categoryId: product.categoryId },
      }).catch(() => {});

      // Increment view count
      Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } }).exec();
    }

    return success(res, product);
  } catch (err) { next(err); }
};

/**
 * PATCH /products/:productId - Update product
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');

    // Ensure ownership
    const profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile || product.sellerId.toString() !== profile._id.toString()) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    const allowed = ['title', 'description', 'price', 'images', 'attributes', 'tags', 'weight', 'dimensions', 'leadTimeDays'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.price !== undefined && typeof updates.price === 'number') {
      updates.price = { amount: updates.price, currency: 'INR' };
    }

    // Status resets to DRAFT on edit if published
    if (product.status === 'PUBLISHED') updates.status = 'DRAFT';

    const updated = await Product.findByIdAndUpdate(req.params.productId, updates, { new: true, runValidators: true });
    return success(res, updated);
  } catch (err) { next(err); }
};

/**
 * DELETE /products/:productId - Archive product
 */
const archiveProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');

    const profile = await SellerProfile.findOne({ userId: req.userId });
    const isAdminOrOwner = req.user.role === 'ADMIN' || (profile && product.sellerId.toString() === profile._id.toString());
    if (!isAdminOrOwner) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    product.status = 'ARCHIVED';
    await product.save();
    return success(res, { message: 'Product archived' });
  } catch (err) { next(err); }
};

/**
 * POST /products/:productId/publish - Publish product
 */
const publishProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');

    const profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile || product.sellerId.toString() !== profile._id.toString()) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    // Check inventory
    const inventory = await InventoryItem.findOne({ productId: product._id, status: 'AVAILABLE' });
    if (!inventory && product.type !== 'MADE_TO_ORDER') {
      throw new AppError('Cannot publish product with no available inventory', 400, 'NO_INVENTORY');
    }

    product.status = 'PENDING_REVIEW';
    product.publishedAt = new Date();
    await product.save();
    return success(res, product);
  } catch (err) { next(err); }
};

/**
 * POST /products/:productId/unpublish - Unpublish product
 */
const unpublishProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');

    const profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile || product.sellerId.toString() !== profile._id.toString()) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    product.status = 'UNPUBLISHED';
    await product.save();
    return success(res, product);
  } catch (err) { next(err); }
};

/**
 * POST /products/:productId/media - Attach media to product
 */
const attachMedia = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');

    const profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile || product.sellerId.toString() !== profile._id.toString()) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    // Support uploaded files from multer
    const files = req.files || (req.file ? [req.file] : []);
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        const base64Url = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        product.images.push({
          url: base64Url,
          altText: product.title,
          isPrimary: product.images.length === 0,
          order: product.images.length,
        });
      }
      await product.save();
      return success(res, product.images);
    }

    const { url, altText, isPrimary } = req.body;
    if (!url) throw new AppError('Media URL or file is required', 400, 'MISSING_URL');

    if (isPrimary) {
      product.images.forEach((img) => { img.isPrimary = false; });
    }

    product.images.push({ url, altText, isPrimary: isPrimary || product.images.length === 0, order: product.images.length });
    await product.save();
    return success(res, product.images);
  } catch (err) { next(err); }
};

/**
 * DELETE /products/:productId/media/:mediaId - Remove media
 */
const deleteMedia = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');

    const profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile || product.sellerId.toString() !== profile._id.toString()) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    product.images = product.images.filter((img) => img._id.toString() !== req.params.mediaId);
    await product.save();
    return success(res, product.images);
  } catch (err) { next(err); }
};

/**
 * GET /products/:productId/inventory - Get inventory for a product
 */
const getInventory = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');

    const inventory = await InventoryItem.find({ productId: product._id });
    return success(res, inventory);
  } catch (err) { next(err); }
};

/**
 * PUT /products/:productId/inventory - Update inventory for a product
 */
const updateInventory = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');

    const profile = await SellerProfile.findOne({ userId: req.userId });
    if (!profile || product.sellerId.toString() !== profile._id.toString()) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    const { sku, quantity, costPrice, location } = req.body;

    const item = await InventoryItem.findOneAndUpdate(
      { productId: product._id, sku },
      { quantity, costPrice, location },
      { new: true, upsert: true }
    );
    return success(res, item);
  } catch (err) { next(err); }
};

module.exports = {
  listProducts, createProduct, getProduct, updateProduct, archiveProduct,
  publishProduct, unpublishProduct, attachMedia, deleteMedia, getInventory, updateInventory,
};
