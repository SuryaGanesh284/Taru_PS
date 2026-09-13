const mongoose = require('mongoose');

const knowledgeDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    sourceType: {
      type: String,
      enum: ['policy', 'faq', 'onboarding', 'catalog', 'marketplace_info'],
      required: true,
    },
    sourceId: { type: String }, // external reference
    content: { type: String, required: true },
    chunks: [
      {
        text: { type: String },
        embedding: [{ type: Number }], // vector embedding
        metadata: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    metadata: { type: mongoose.Schema.Types.Mixed },
    embeddingRef: { type: String }, // reference to vector DB entry
    version: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['PENDING', 'INDEXED', 'FAILED', 'DEACTIVATED'],
      default: 'PENDING',
    },
    indexedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

knowledgeDocumentSchema.index({ sourceType: 1, status: 1 });
knowledgeDocumentSchema.index({ status: 1 });
// MongoDB Atlas text search for fallback retrieval
knowledgeDocumentSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
