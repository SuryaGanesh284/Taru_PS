const Category = require('../models/Category');
const { AppError } = require('../middleware/errorHandler');
const { success, created, paginated } = require('../utils/response');

const DEFAULT_CATEGORIES = [
  {
    name: 'Handicrafts',
    slug: 'handicrafts',
    description: 'Traditional handcrafted items, artisan creations, and home decor',
    sortOrder: 1,
    active: true,
  },
  {
    name: 'Pottery',
    slug: 'pottery',
    description: 'Handcrafted clay, terracotta pottery, and ceramic kitchenware',
    sortOrder: 2,
    active: true,
  },
  {
    name: 'Textiles',
    slug: 'textiles',
    description: 'Traditional handloom fabrics, sarees, dupattas, and garments',
    sortOrder: 3,
    active: true,
  },
  {
    name: 'Organic Food',
    slug: 'organic-food',
    description: 'Naturally grown grains, spices, pickles, and honey',
    sortOrder: 4,
    active: true,
  },
  {
    name: 'Jewellery',
    slug: 'jewellery',
    description: 'Handmade ethnic jewellery, beads, and tribal ornaments',
    sortOrder: 5,
    active: true,
  },
  {
    name: 'Bamboo Products',
    slug: 'bamboo-products',
    description: 'Eco-friendly bamboo and cane baskets, furniture, and decor',
    sortOrder: 6,
    active: true,
  },
  {
    name: 'Jute Crafts',
    slug: 'jute-crafts',
    description: 'Sustainable jute bags, wall hangings, and rugs',
    sortOrder: 7,
    active: true,
  },
  {
    name: 'Woodcrafts',
    slug: 'woodcrafts',
    description: 'Hand-carved wooden sculptures, kitchenware, and utilities',
    sortOrder: 8,
    active: true,
  },
];

/**
 * GET /categories - List all categories (with optional parent filter)
 */
const listCategories = async (req, res, next) => {
  try {
    const filter = { active: true };
    if (req.query.parentId) filter.parentId = req.query.parentId === 'root' ? null : req.query.parentId;

    let categories = await Category.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .populate('parentId', 'name slug');

    // If no categories found and querying root / active categories, auto-seed defaults into DB
    if ((!categories || categories.length === 0) && (!req.query.parentId || req.query.parentId === 'root')) {
      try {
        const totalCount = await Category.countDocuments();
        if (totalCount === 0) {
          await Category.insertMany(DEFAULT_CATEGORIES);
          categories = await Category.find(filter)
            .sort({ sortOrder: 1, name: 1 })
            .populate('parentId', 'name slug');
        }
      } catch (seedErr) {
        // Fallback in case of DB read-only or index constraint
        if (!categories || categories.length === 0) {
          categories = DEFAULT_CATEGORIES.map((c, index) => ({
            _id: `default-cat-${index + 1}`,
            ...c,
          }));
        }
      }
    }

    const safeCategories = Array.isArray(categories) ? categories : [];

    return res.status(200).json({
      success: true,
      data: safeCategories,
      categories: safeCategories,
      items: safeCategories,
      meta: {
        requestId: res.req?.requestId,
        total: safeCategories.length,
      },
    });
  } catch (err) { next(err); }
};

/**
 * GET /categories/:categoryId - Category details
 */
const getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.categoryId)
      .populate('parentId', 'name slug');
    if (!category || !category.active) throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    return success(res, category);
  } catch (err) { next(err); }
};

/**
 * POST /categories - Create category (Admin only)
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, parentId, attributes, sortOrder, imageUrl } = req.body;

    if (!name || !slug) throw new AppError('Name and slug are required', 400, 'MISSING_FIELDS');

    const category = await Category.create({ name, slug, description, parentId, attributes, sortOrder, imageUrl });
    return created(res, category);
  } catch (err) { next(err); }
};

/**
 * PATCH /categories/:categoryId - Update category (Admin only)
 */
const updateCategory = async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'parentId', 'attributes', 'sortOrder', 'imageUrl', 'active'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const category = await Category.findByIdAndUpdate(req.params.categoryId, updates, { new: true, runValidators: true });
    if (!category) throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    return success(res, category);
  } catch (err) { next(err); }
};

/**
 * DELETE /categories/:categoryId - Deactivate category (Admin only)
 */
const deactivateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.categoryId, { active: false }, { new: true });
    if (!category) throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    return success(res, { message: 'Category deactivated' });
  } catch (err) { next(err); }
};

module.exports = { listCategories, getCategory, createCategory, updateCategory, deactivateCategory, DEFAULT_CATEGORIES };
