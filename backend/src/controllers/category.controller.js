const Category = require('../models/Category');
const { AppError } = require('../middleware/errorHandler');
const { success, created, paginated } = require('../utils/response');

/**
 * GET /categories - List all categories (with optional parent filter)
 */
const listCategories = async (req, res, next) => {
  try {
    const filter = { active: true };
    if (req.query.parentId) filter.parentId = req.query.parentId === 'root' ? null : req.query.parentId;

    const categories = await Category.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .populate('parentId', 'name slug');

    return success(res, categories);
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

module.exports = { listCategories, getCategory, createCategory, updateCategory, deactivateCategory };
