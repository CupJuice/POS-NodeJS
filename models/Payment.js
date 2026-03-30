const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentNumber: { type: String, unique: true },
  sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
  saleNumber: { type: String },
  totalAmount: { type: Number, required: true },
  paymentMethods: [{
    method: {
      type: String,
      enum: ['cash', 'credit_card', 'debit_card', 'qr_promptpay', 'points'],
      required: true
    },
    amount: { type: Number, required: true },
    reference: { type: String }
  }],
  cashReceived: { type: Number, default: 0 },
  changeAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['completed', 'refunded', 'partial'],
    default: 'completed'
  },
  paymentDate: { type: Date, default: Date.now }
}, { timestamps: true });

paymentSchema.pre('save', async function() {
  if (!this.paymentNumber) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    let isUnique = false;
    let paymentNumber;
    while (!isUnique) {
      const count = await mongoose.model('Payment').countDocuments({
        paymentDate: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999))
        }
      });
      paymentNumber = `PAY${dateStr}${String(count + 1).padStart(4, '0')}`;
      const existing = await mongoose.model('Payment').findOne({ paymentNumber });
      if (!existing) isUnique = true;
    }
    this.paymentNumber = paymentNumber;
  }
});

module.exports = mongoose.model('Payment', paymentSchema);