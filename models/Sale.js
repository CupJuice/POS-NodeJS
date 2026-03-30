const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productId: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true }
});

const saleSchema = new mongoose.Schema({
  saleNumber: { type: String, unique: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  items: [saleItemSchema],
  subtotal: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 7 },
  totalAmount: { type: Number, required: true },
  pointsEarned: { type: Number, default: 0 },
  pointsUsed: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  note: { type: String },
  saleDate: { type: Date, default: Date.now }
}, { timestamps: true });

saleSchema.pre('save', async function() {
  if (!this.saleNumber) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    let isUnique = false;
    let saleNumber;
    let attempt = 1;
    while (!isUnique) {
      const lastSale = await mongoose.model('Sale').findOne({
        saleNumber: new RegExp(`^S${dateStr}`)
      }).sort({ saleNumber: -1 });

      if (lastSale) {
        const lastNum = parseInt(lastSale.saleNumber.slice(-4)) + attempt;
        saleNumber = `S${dateStr}${String(lastNum).padStart(4, '0')}`;
      } else {
        saleNumber = `S${dateStr}${String(attempt).padStart(4, '0')}`;
      }

      const existing = await mongoose.model('Sale').findOne({ saleNumber });
      if (!existing) isUnique = true;
      else attempt++;
    }
    this.saleNumber = saleNumber;
  }
});

module.exports = mongoose.model('Sale', saleSchema);