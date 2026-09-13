const mongoose = require('mongoose');

const aiRunSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    intent: { type: String },
    route: { type: String },
    promptVersion: { type: String },
    model: { type: String },
    retrievalDocs: { type: Number, default: 0 },
    tools: [{ type: String }],
    latencyMs: { type: Number },
    tokensUsed: { type: Number },
    success: { type: Boolean, default: true },
    error: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

aiRunSchema.index({ userId: 1, createdAt: -1 });
aiRunSchema.index({ intent: 1, createdAt: -1 });
// TTL: 90 days
aiRunSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AiRun', aiRunSchema);
