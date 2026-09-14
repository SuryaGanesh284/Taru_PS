const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, maxlength: 500 },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    imageUrl: { type: String },
    attributes: [
      {
        name: { type: String },
        type: { type: String, enum: ['string', 'number', 'boolean', 'select'] },
        options: [{ type: String }],
        required: { type: Boolean, default: false },
      },
    ],
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ parentId: 1 });
categorySchema.index({ active: 1 });

module.exports = mongoose.model('Category', categorySchema);
