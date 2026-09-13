const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    strategy: {
      type: String,
      enum: ['collaborative', 'content_based', 'trending', 'category_affinity', 'ai_generated'],
      required: true,
    },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        score: { type: Number },
        reason: { type: String },
      },
    ],
    context: { type: mongoose.Schema.Types.Mixed },
    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

recommendationSchema.index({ userId: 1, strategy: 1 });
recommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
