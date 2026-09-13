const mongoose = require('mongoose');

const shipmentEventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  description: { type: String },
  location: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const shipmentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    carrier: { type: String },
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    status: {
      type: String,
      enum: ['AWAITING_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED'],
      default: 'AWAITING_PICKUP',
    },
    estimatedDeliveryDate: { type: Date },
    deliveredAt: { type: Date },
    events: [shipmentEventSchema],
    shippingLabel: { type: String }, // URL to label
    weight: { type: Number },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
  },
  { timestamps: true }
);

shipmentSchema.index({ orderId: 1 });
shipmentSchema.index({ trackingNumber: 1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
