const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  addedAt: { type: Date, default: Date.now },
});

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [wishlistItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wishlist', wishlistSchema);
