const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      maxlength: 5000,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    price: {
      amount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR' },
      discountedAmount: { type: Number, min: 0 },
    },
    type: {
      type: String,
      enum: ['STANDARD', 'UNIQUE', 'MADE_TO_ORDER'],
      default: 'STANDARD',
    },
    images: [
      {
        url: { type: String, required: true },
        altText: { type: String },
        isPrimary: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
      },
    ],
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED', 'REJECTED'],
      default: 'DRAFT',
    },
    rejectionReason: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    publishedAt: { type: Date },
    leadTimeDays: { type: Number }, // for MADE_TO_ORDER
    weight: { type: Number }, // in grams
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    slug: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

productSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    const baseSlug = typeof this.title === 'string'
      ? this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      : 'product';
    this.slug = `${baseSlug}-${Date.now().toString(36)}`;
  }
  next();
});

// Text search index
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ sellerId: 1, status: 1 });
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ type: 1 });
productSchema.index({ 'price.amount': 1 });
productSchema.index({ status: 1, publishedAt: -1 });
productSchema.index({ isFeatured: 1, status: 1 });

module.exports = mongoose.model('Product', productSchema);
