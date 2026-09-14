const mongoose = require('mongoose');

const sellerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    shgName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: { type: String, maxlength: 2000 },
    location: {
      village: { type: String },
      district: { type: String },
      state: { type: String },
      pincode: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    contactPhone: { type: String },
    contactEmail: { type: String },
    logoUrl: { type: String },
    bannerUrl: { type: String },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    verificationDocuments: [
      {
        type: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    bankAccount: {
      accountNumber: { type: String, select: false },
      ifscCode: { type: String, select: false },
      accountHolder: { type: String, select: false },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

sellerProfileSchema.index({ verificationStatus: 1 });
sellerProfileSchema.index({ 'location.district': 1, 'location.state': 1 });

module.exports = mongoose.model('SellerProfile', sellerProfileSchema);
