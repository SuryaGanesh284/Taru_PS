const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // snapshot at add-time
  title: { type: String }, // snapshot
  imageUrl: { type: String }, // snapshot
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerProfile' },
});

const cartSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    couponCode: { type: String },
    discount: { type: Number, default: 0 },
    version: { type: Number, default: 0 }, // optimistic concurrency
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

module.exports = mongoose.model('Cart', cartSchema);

