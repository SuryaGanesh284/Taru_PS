const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    provider: {
      type: String,
      required: true, // e.g. 'razorpay', 'stripe', 'payu'
    },
    providerPaymentId: {
      type: String,
      sparse: true,
    },
    providerOrderId: { type: String },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['CREATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'EXPIRED'],
      default: 'CREATED',
    },
    // Webhook event IDs for idempotency
    processedEventIds: [{ type: String }],
    refunds: [
      {
        refundId: { type: String },
        amount: { type: Number },
        reason: { type: String },
        status: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    metadata: { type: mongoose.Schema.Types.Mixed },
    paidAt: { type: Date },
    failureReason: { type: String },
  },
  { timestamps: true }
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ providerPaymentId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
