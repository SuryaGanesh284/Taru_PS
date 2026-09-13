const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    buyerInfo: {
      name: String,
      email: String,
      phone: String,
      address: String,
    },
    sellerInfo: {
      name: String,
      address: String,
      gstNumber: String,
    },
    items: [invoiceItemSchema],
    totals: {
      subtotal: { type: Number, required: true },
      shippingFee: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      total: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
    },
    pdfUrl: { type: String },
    issuedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['DRAFT', 'ISSUED', 'CANCELLED'],
      default: 'DRAFT',
    },
  },
  { timestamps: true }
);

// Auto-generate invoice number
invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    this.invoiceNumber = `INV-${timestamp}`;
  }
  next();
});

invoiceSchema.index({ orderId: 1 });
invoiceSchema.index({ invoiceNumber: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
