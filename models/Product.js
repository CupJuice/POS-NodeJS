const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: { type: String, unique: true },
  barcode: { type: String, unique: true, sparse: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true },
  costPrice: { type: Number, required: true, min: 0 },
  sellPrice: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  minStock: { type: Number, default: 5 },
  unit: { type: String, default: 'ชิ้น' },
  image: { type: String, default: '' },
  status: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.pre('save', async function() {
  if (!this.productId) {
    let isUnique = false;
    let productId;
    while (!isUnique) {
      const count = await mongoose.model('Product').countDocuments();
      productId = 'P' + String(count + 1).padStart(5, '0');
      const existing = await mongoose.model('Product').findOne({ productId });
      if (!existing) isUnique = true;
    }
    this.productId = productId;
  }
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.costPrice === 0) return 0;
  return (((this.sellPrice - this.costPrice) / this.costPrice) * 100).toFixed(2);
});

// Low stock check
productSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.minStock;
});

module.exports = mongoose.model('Product', productSchema);