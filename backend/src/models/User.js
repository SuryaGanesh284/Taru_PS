const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['BUYER', 'SELLER', 'ADMIN'],
      default: 'BUYER',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    preferences: {
      language: { type: String, default: 'en' },
      categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
    },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    avatarUrl: { type: String },
    lastLoginAt: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ role: 1, status: 1 });

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  if (this.passwordHash.startsWith('$2')) return next(); // already hashed
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

module.exports = mongoose.model('User', userSchema);
