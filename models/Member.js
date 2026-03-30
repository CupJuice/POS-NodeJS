const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  memberId: { type: String, unique: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  birthDate: { type: Date },
  points: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  level: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze'
  },
  status: { type: Boolean, default: true },
  joinDate: { type: Date, default: Date.now }
}, { timestamps: true });

memberSchema.pre('save', async function() {
  // Generate memberId
  if (!this.memberId) {
    let isUnique = false;
    let memberId;
    while (!isUnique) {
      const count = await mongoose.model('Member').countDocuments();
      memberId = 'M' + String(count + 1).padStart(5, '0');
      const existing = await mongoose.model('Member').findOne({ memberId });
      if (!existing) isUnique = true;
    }
    this.memberId = memberId;
  }

  // คำนวณ level
  if (this.totalSpent >= 50000) this.level = 'Platinum';
  else if (this.totalSpent >= 20000) this.level = 'Gold';
  else if (this.totalSpent >= 5000) this.level = 'Silver';
  else this.level = 'Bronze';
});

module.exports = mongoose.model('Member', memberSchema);