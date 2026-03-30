const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// ─── Models ───────────────────────────────────────────────────────────────────

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
  level: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' },
  status: { type: Boolean, default: true },
  joinDate: { type: Date, default: Date.now }
}, { timestamps: true });

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

const Employee = mongoose.model('Employee', employeeSchema);
const Member   = mongoose.model('Member',   memberSchema);
const Product  = mongoose.model('Product',  productSchema);

// ─── Data ─────────────────────────────────────────────────────────────────────

const employees = [
  {
    employeeId: 'E0001',
    firstName: 'สมชาย',   lastName: 'ใจดี',
    phone: '0812345678',  email: 'somchai@pos.com',
    position: 'ผู้ดูแลระบบ', salary: 35000,
    pin: 'admin123', status: true
  },
  {
    employeeId: 'E0002',
    firstName: 'สมหญิง',  lastName: 'รักงาน',
    phone: '0823456789',  email: 'somying@pos.com',
    position: 'ผู้จัดการ',  salary: 28000,
    pin: 'manager123', status: true
  },
  {
    employeeId: 'E0003',
    firstName: 'วิชัย',   lastName: 'ขยันดี',
    phone: '0834567890',  email: 'wichai@pos.com',
    position: 'แคชเชียร์',  salary: 15000,
    pin: 'cashier123', status: true
  },
  {
    employeeId: 'E0004',
    firstName: 'นภา',     lastName: 'สดใส',
    phone: '0845678901',  email: 'napa@pos.com',
    position: 'พนักงานขาย', salary: 13000,
    pin: 'staff123', status: true
  }
];

const members = [
  {
    memberId: 'M00001',
    firstName: 'ประภา',   lastName: 'มีสุข',
    phone: '0891111111',  email: 'prapa@gmail.com',
    address: '123 ถ.สุขุมวิท กรุงเทพฯ',
    birthDate: new Date('1990-05-15'),
    points: 1200, totalSpent: 12000, level: 'Silver', status: true
  },
  {
    memberId: 'M00002',
    firstName: 'ธนาคาร', lastName: 'รวยมาก',
    phone: '0892222222',  email: 'thanakarn@gmail.com',
    address: '456 ถ.พระราม4 กรุงเทพฯ',
    birthDate: new Date('1985-08-20'),
    points: 5800, totalSpent: 58000, level: 'Platinum', status: true
  },
  {
    memberId: 'M00003',
    firstName: 'มานี',   lastName: 'ชอบซื้อ',
    phone: '0893333333',  email: 'manee@gmail.com',
    address: '789 ถ.รัชดา กรุงเทพฯ',
    birthDate: new Date('1995-12-01'),
    points: 300, totalSpent: 3000, level: 'Bronze', status: true
  },
  {
    memberId: 'M00004',
    firstName: 'กิตติ',  lastName: 'ใจงาม',
    phone: '0894444444',  email: 'kitti@gmail.com',
    address: '321 ถ.ลาดพร้าว กรุงเทพฯ',
    birthDate: new Date('1988-03-10'),
    points: 2100, totalSpent: 21000, level: 'Gold', status: true
  },
  {
    memberId: 'M00005',
    firstName: 'ลัดดา',  lastName: 'ประหยัด',
    phone: '0895555555',  email: 'ladda@gmail.com',
    address: '654 ถ.งามวงศ์วาน นนทบุรี',
    birthDate: new Date('2000-07-25'),
    points: 80, totalSpent: 800, level: 'Bronze', status: true
  }
];

const products = [
  // เครื่องดื่ม
  { productId: 'P00001', name: 'น้ำดื่มตราช้าง 600ml',      category: 'เครื่องดื่ม', costPrice: 5,    sellPrice: 10,   stock: 200, minStock: 20, unit: 'ขวด' },
  { productId: 'P00002', name: 'น้ำอัดลม Pepsi 325ml',      category: 'เครื่องดื่ม', costPrice: 10,   sellPrice: 18,   stock: 150, minStock: 15, unit: 'กระป๋อง' },
  { productId: 'P00003', name: 'ชาเขียว Oishi 350ml',       category: 'เครื่องดื่ม', costPrice: 12,   sellPrice: 22,   stock: 120, minStock: 15, unit: 'ขวด' },
  { productId: 'P00004', name: 'กาแฟ Nescafe 180ml',        category: 'เครื่องดื่ม', costPrice: 8,    sellPrice: 15,   stock: 3,   minStock: 10, unit: 'กระป๋อง' },
  { productId: 'P00005', name: 'นมโอเลี้ยง 250ml',          category: 'เครื่องดื่ม', costPrice: 9,    sellPrice: 16,   stock: 80,  minStock: 10, unit: 'กล่อง' },

  // ขนม
  { productId: 'P00006', name: 'มันฝรั่ง Lay\'s รสออริจินัล', category: 'ขนม',        costPrice: 15,   sellPrice: 25,   stock: 100, minStock: 10, unit: 'ถุง' },
  { productId: 'P00007', name: 'บิสกิต Oreo',               category: 'ขนม',        costPrice: 20,   sellPrice: 35,   stock: 90,  minStock: 10, unit: 'แพ็ค' },
  { productId: 'P00008', name: 'ช็อคโกแลต KitKat',          category: 'ขนม',        costPrice: 18,   sellPrice: 30,   stock: 4,   minStock: 10, unit: 'แท่ง' },
  { productId: 'P00009', name: 'ป๊อปคอร์น Corntos',         category: 'ขนม',        costPrice: 12,   sellPrice: 20,   stock: 60,  minStock: 8,  unit: 'ถุง' },

  // ของใช้ในบ้าน
  { productId: 'P00010', name: 'แชมพูซันซิล 180ml',         category: 'ของใช้',     costPrice: 45,   sellPrice: 75,   stock: 50,  minStock: 5,  unit: 'ขวด' },
  { productId: 'P00011', name: 'สบู่ Lux ก้อนชมพู',         category: 'ของใช้',     costPrice: 18,   sellPrice: 30,   stock: 70,  minStock: 5,  unit: 'ก้อน' },
  { productId: 'P00012', name: 'ยาสีฟัน Colgate 150g',      category: 'ของใช้',     costPrice: 35,   sellPrice: 55,   stock: 2,   minStock: 5,  unit: 'หลอด' },
  { productId: 'P00013', name: 'กระดาษทิชชู Cellox 6 ม้วน', category: 'ของใช้',     costPrice: 55,   sellPrice: 85,   stock: 40,  minStock: 5,  unit: 'แพ็ค' },

  // อาหารสำเร็จรูป
  { productId: 'P00014', name: 'มาม่า รสต้มยำกุ้ง',         category: 'อาหาร',      costPrice: 6,    sellPrice: 10,   stock: 300, minStock: 30, unit: 'ซอง' },
  { productId: 'P00015', name: 'ข้าวกล่อง CP รสไก่ผัดกระเพรา', category: 'อาหาร',  costPrice: 35,   sellPrice: 55,   stock: 20,  minStock: 5,  unit: 'กล่อง' },
  { productId: 'P00016', name: 'ซาร่า ข้าวโพดอบเนย',        category: 'อาหาร',      costPrice: 10,   sellPrice: 18,   stock: 80,  minStock: 10, unit: 'ถุง' },
];

// ─── Seed Function ─────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/pos_system');
  console.log('✅ Connected to MongoDB');

  // ล้างข้อมูลเดิม
  await Promise.all([
    Employee.deleteMany({}),
    Member.deleteMany({}),
    Product.deleteMany({})
  ]);
  console.log('🗑️  ล้างข้อมูลเดิมแล้ว');

  // Hash passwords พนักงาน
  const hashedEmployees = await Promise.all(
    employees.map(async (emp) => ({
      ...emp,
      pin: await bcrypt.hash(emp.pin, 10)
    }))
  );

  await Employee.insertMany(hashedEmployees);
  console.log(`👤 เพิ่มพนักงาน ${hashedEmployees.length} คน`);

  await Member.insertMany(members);
  console.log(`🪪 เพิ่มสมาชิก ${members.length} คน`);

  await Product.insertMany(products);
  console.log(`📦 เพิ่มสินค้า ${products.length} รายการ`);

  console.log('\n🎉 Seed สำเร็จ! ข้อมูล login:');
  console.log('┌─────────────────────────────────────────────────────┐');
  console.log('│  ตำแหน่ง        │  Email               │  Password   │');
  console.log('├─────────────────────────────────────────────────────┤');
  console.log('│  ผู้ดูแลระบบ     │  somchai@pos.com     │  admin123   │');
  console.log('│  ผู้จัดการ       │  somying@pos.com     │  manager123 │');
  console.log('│  แคชเชียร์       │  wichai@pos.com      │  cashier123 │');
  console.log('│  พนักงานขาย     │  napa@pos.com        │  staff123   │');
  console.log('└─────────────────────────────────────────────────────┘');

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected');
}

seed().catch((err) => {
  console.error('❌ Seed ล้มเหลว:', err.message);
  mongoose.disconnect();
  process.exit(1);
});