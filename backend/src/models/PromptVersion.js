const mongoose = require('mongoose');

const promptVersionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    version: { type: Number, required: true },
    description: { type: String },
    fragments: [
      {
        key: { type: String, required: true }, // e.g. 'BASE_POLICY', 'ROLE_BUYER', 'INTENT_ORDER_STATUS'
        text: { type: String, required: true },
        order: { type: Number, default: 0 },
      },
    ],
    conditions: {
      roles: [{ type: String }],
      intents: [{ type: String }],
    },
    instructions: [{ type: String }],
    active: { type: Boolean, default: false },
    testedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Unique name + version
promptVersionSchema.index({ name: 1, version: 1 }, { unique: true });
promptVersionSchema.index({ active: 1, name: 1 });

module.exports = mongoose.model('PromptVersion', promptVersionSchema);
