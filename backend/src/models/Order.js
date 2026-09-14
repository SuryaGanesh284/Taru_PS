const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerProfile' },
  title: { type: String, required: true },
  imageUrl: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  productType: { type: String, enum: ['STANDARD', 'UNIQUE', 'MADE_TO_ORDER'] },
});

const addressSnapshot = new mongoose.Schema({
  name: String,
  phone: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: 'IN' },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: addressSnapshot,
    pricing: {
      subtotal: { type: Number, required: true },
      shippingFee: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      total: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
    },
    status: {
      type: String,
      enum: [
        'PENDING_PAYMENT',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'PAYMENT_FAILED',
        'CANCELLED',
      ],
      default: 'PENDING_PAYMENT',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'PENDING',
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    couponCode: { type: String },
    notes: { type: String },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    confirmedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'items.sellerId': 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
