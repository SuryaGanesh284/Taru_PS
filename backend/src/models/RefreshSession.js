const mongoose = require('mongoose');

const refreshSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    userAgent: { type: String },
    ipAddress: { type: String },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: { type: Date },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

refreshSessionSchema.index({ userId: 1 });
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshSession', refreshSessionSchema);
