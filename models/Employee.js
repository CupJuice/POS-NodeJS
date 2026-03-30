const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String, trim: true, lowercase: true },
  position: {
    type: String,
    enum: ['แคชเชียร์', 'ผู้จัดการ', 'พนักงานขาย', 'ผู้ดูแลระบบ'],
    required: true
  },
  salary: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  status: { type: Boolean, default: true },
  pin: { type: String, required: true }
}, { timestamps: true });
// Auto-generate employeeId
employeeSchema.pre('save', async function() {
  if (!this.employeeId) {
    let isUnique = false;
    let employeeId;
    while (!isUnique) {
      const count = await mongoose.model('Employee').countDocuments();
      employeeId = 'E' + String(count + 1).padStart(4, '0');
      const existing = await mongoose.model('Employee').findOne({ employeeId });
      if (!existing) isUnique = true;
    }
    this.employeeId = employeeId;
  }

  // Hash password ถ้ามีการเปลี่ยนแปลง
  if (this.isModified('pin')) {
    this.pin = await bcrypt.hash(this.pin, 10);
  }
});

// Method สำหรับตรวจสอบ password
employeeSchema.methods.verifyPin = async function(inputPin) {
  return bcrypt.compare(inputPin, this.pin);
};

module.exports = mongoose.model('Employee', employeeSchema);