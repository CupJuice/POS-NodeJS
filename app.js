const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/pos_system')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));

app.use(session({
  secret: 'pos-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(flash());

// Global Variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.moment = require('moment');
  res.locals.currentUser = req.session.employee || null;
  next();
});

// Auth Middleware
const isAuthenticated = async (req, res, next) => {
  if (!req.session.employee) {
    req.flash('error', 'กรุณาเข้าสู่ระบบก่อน');
    return res.redirect('/auth/login');
  }
  try {
    const Employee = require('./models/Employee');
    const employee = await Employee.findById(req.session.employee._id);
    if (!employee || !employee.status) {
      req.session.destroy();
      req.flash('error', 'บัญชีของคุณถูกลบหรือระงับการใช้งาน');
      return res.redirect('/auth/login');
    }
    next();
  } catch (err) {
    req.session.destroy();
    res.redirect('/auth/login');
  }
};

// Role Middleware
const allowRoles = (...roles) => (req, res, next) => {
  if (roles.includes(req.session.employee.position)) return next();
  req.flash('error', '⛔ คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
  res.redirect('/');
};

const managerOnly = allowRoles('ผู้จัดการ', 'ผู้ดูแลระบบ');
const cashierUp   = allowRoles('แคชเชียร์', 'พนักงานขาย', 'ผู้จัดการ', 'ผู้ดูแลระบบ');

// Routes
app.use('/auth',      require('./routes/auth'));
app.use('/',          isAuthenticated, require('./routes/index'));
app.use('/members',   isAuthenticated, cashierUp,  require('./routes/members'));
app.use('/employees', isAuthenticated, managerOnly, require('./routes/employees'));
app.use('/products',  isAuthenticated, cashierUp,  require('./routes/products'));
app.use('/sales',     isAuthenticated, cashierUp,  require('./routes/sales'));
app.use('/payments',  isAuthenticated, cashierUp,  require('./routes/payments'));
app.use('/reports',   isAuthenticated, managerOnly, require('./routes/reports'));

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'ไม่พบหน้า' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 POS Server running on http://localhost:${PORT}`);
});