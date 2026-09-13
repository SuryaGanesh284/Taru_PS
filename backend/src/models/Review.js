const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: { type: String, maxlength: 200 },
    text: { type: String, maxlength: 2000 },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'],
      default: 'PENDING',
    },
    sellerResponse: {
      text: { type: String },
      respondedAt: { type: Date },
    },
    isVerifiedPurchase: { type: Boolean, default: true },
    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One review per buyer per product per order
reviewSchema.index({ buyerId: 1, productId: 1, orderId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, status: 1 });

module.exports = mongoose.model('Review', reviewSchema);
