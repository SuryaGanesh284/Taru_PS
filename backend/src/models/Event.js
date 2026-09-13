const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sessionId: { type: String }, // for anonymous users
    type: {
      type: String,
      required: true,
      enum: [
        'product_view',
        'product_click',
        'search',
        'category_view',
        'cart_add',
        'cart_remove',
        'wishlist_add',
        'wishlist_remove',
        'checkout_start',
        'purchase',
        'review_submit',
        'ai_chat',
      ],
    },
    entityId: { type: mongoose.Schema.Types.ObjectId }, // productId, categoryId, etc.
    entityType: { type: String }, // 'product', 'category', 'search', etc.
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: false }
);

eventSchema.index({ userId: 1, type: 1, timestamp: -1 });
eventSchema.index({ entityId: 1, type: 1 });
eventSchema.index({ timestamp: -1 });
eventSchema.index({ sessionId: 1 });

// TTL: Keep behavior events for 90 days
eventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('Event', eventSchema);
