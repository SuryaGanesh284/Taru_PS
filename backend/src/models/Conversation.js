const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system', 'tool'], required: true },
  content: { type: String, required: true },
  intent: { type: String },
  citations: [{ documentId: String, title: String, excerpt: String }],
  toolCalls: [
    {
      toolName: { type: String },
      arguments: { type: mongoose.Schema.Types.Mixed },
      result: { type: mongoose.Schema.Types.Mixed },
      executedAt: { type: Date },
    },
  ],
  timestamp: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    title: { type: String },
    messages: [aiMessageSchema],
    lastIntent: { type: String },
    status: {
      type: String,
      enum: ['ACTIVE', 'CLOSED'],
      default: 'ACTIVE',
    },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, createdAt: -1 });
// TTL: Auto-delete conversations older than 6 months
conversationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 6 * 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Conversation', conversationSchema);
