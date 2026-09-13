const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0,
    },
    // For UNIQUE products — identifies the specific physical item
    uniqueItemId: {
      type: String,
      sparse: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'SOLD', 'DAMAGED', 'REMOVED'],
      default: 'AVAILABLE',
    },
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    reservedAt: { type: Date },
    reservedUntil: { type: Date },
    // Optimistic concurrency version field
    version: {
      type: Number,
      default: 0,
    },
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    costPrice: { type: Number },
    location: { type: String }, // warehouse/shelf location
  },
  { timestamps: true }
);

inventoryItemSchema.index({ productId: 1 });
inventoryItemSchema.index({ uniqueItemId: 1 });
inventoryItemSchema.index({ productId: 1, status: 1 });
inventoryItemSchema.index({ sku: 1, productId: 1 });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
