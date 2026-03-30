const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// GET Login
router.get('/login', (req, res) => {
  if (req.session.employee) return res.redirect('/');
  res.render('auth/login', { title: 'เข้าสู่ระบบ' });
});

// POST Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const employee = await Employee.findOne({ 
      email: email.toLowerCase().trim(), 
      status: true 
    });

    if (!employee) {
      req.flash('error', 'ไม่พบอีเมลนี้ในระบบ หรือบัญชีถูกระงับ');
      return res.redirect('/auth/login');
    }

    // ✅ ใช้ bcrypt เปรียบเทียบ password
    const isMatch = await employee.verifyPin(password);
    if (!isMatch) {
      req.flash('error', 'รหัสผ่านไม่ถูกต้อง');
      return res.redirect('/auth/login');
    }

    req.session.employee = {
      _id: employee._id,
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.position
    };

    req.flash('success', `ยินดีต้อนรับ ${employee.firstName} ${employee.lastName}`);
    res.redirect('/');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด: ' + err.message);
    res.redirect('/auth/login');
  }
});

// GET Register
router.get('/register', (req, res) => {
  if (req.session.employee) return res.redirect('/');
  res.render('auth/register', { title: 'สมัครบัญชีพนักงาน' });
});

// POST Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, phone, email, position, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      req.flash('error', 'รหัสผ่านไม่ตรงกัน');
      return res.redirect('/auth/register');
    }

    if (password.length < 6) {
      req.flash('error', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return res.redirect('/auth/register');
    }

    const existingEmail = await Employee.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      req.flash('error', 'อีเมลนี้มีในระบบแล้ว');
      return res.redirect('/auth/register');
    }

    const existingPhone = await Employee.findOne({ phone });
    if (existingPhone) {
      req.flash('error', 'เบอร์โทรศัพท์นี้มีในระบบแล้ว');
      return res.redirect('/auth/register');
    }

    // ✅ ลบ employeeId ออก — ให้ pre('save') จัดการเอง
    const employee = new Employee({
      firstName,
      lastName,
      phone,
      email: email.toLowerCase().trim(),
      position,
      salary: 0,
      pin: password,
      status: true
    });

    await employee.save();

    req.flash('success', `สมัครสำเร็จ! รหัสพนักงานของคุณคือ ${employee.employeeId} กรุณาเข้าสู่ระบบ`);
    res.redirect('/auth/login');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด: ' + err.message);
    res.redirect('/auth/register');
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/auth/login');
});

module.exports = router;