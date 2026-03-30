const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const bcrypt = require('bcrypt');

router.get('/', async (req, res) => {
  try {
    const { search, position, page = 1 } = req.query;
    const limit = 10;
    const query = {};
    if (search) {
      query.$or = [
        { employeeId: new RegExp(search, 'i') },
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }
    if (position) query.position = position;

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);

    res.render('employees/index', {
      title: 'จัดการพนักงาน',
      employees, search: search || '', positionFilter: position || '',
      currentPage: parseInt(page), totalPages: Math.ceil(total / limit), total
    });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด: ' + err.message);
    res.redirect('/');
  }
});

router.get('/new', (req, res) => {
  res.render('employees/new', { title: 'เพิ่มพนักงานใหม่', employee: {} });
});

router.post('/', async (req, res) => {
  try {
    // กรณีไม่ได้กรอก pin ให้แจ้งเตือน
    if (!req.body.pin || req.body.pin.trim() === '') {
      req.flash('error', 'กรุณากรอกรหัสผ่าน');
      return res.render('employees/new', { title: 'เพิ่มพนักงานใหม่', employee: req.body });
    }

    const employee = new Employee(req.body);
    await employee.save();
    req.flash('success', 'เพิ่มพนักงานสำเร็จ!');
    res.redirect('/employees');
  } catch (err) {
    let errorMsg = err.message;
    if (err.code === 11000) {
      if (err.message.includes('email')) errorMsg = 'อีเมลนี้มีในระบบแล้ว';
      if (err.message.includes('phone')) errorMsg = 'เบอร์โทรนี้มีในระบบแล้ว';
    }
    req.flash('error', errorMsg);
    res.render('employees/new', { title: 'เพิ่มพนักงานใหม่', employee: req.body });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) { req.flash('error', 'ไม่พบพนักงาน'); return res.redirect('/employees'); }
    const Sale = require('../models/Sale');
    const salesCount = await Sale.countDocuments({ employee: req.params.id, status: 'completed' });
    res.render('employees/show', { title: `พนักงาน: ${employee.firstName}`, employee, salesCount });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/employees');
  }
});

router.get('/:id/edit', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) { req.flash('error', 'ไม่พบพนักงาน'); return res.redirect('/employees'); }
    res.render('employees/edit', { title: 'แก้ไขข้อมูลพนักงาน', employee });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/employees');
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (req.session.employee._id.toString() === req.params.id) {
      req.body.status = true;
    }

    // ✅ ถ้ากรอก password ใหม่ ให้ hash ก่อน เพราะ findByIdAndUpdate ข้าม pre('save')
    if (req.body.pin && req.body.pin.trim() !== '') {
      req.body.pin = await bcrypt.hash(req.body.pin.trim(), 10);
    } else {
      delete req.body.pin;
    }

    await Employee.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    req.flash('success', 'อัพเดทข้อมูลพนักงานสำเร็จ!');
    res.redirect('/employees');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด: ' + err.message);
    res.redirect('/employees/' + req.params.id + '/edit');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Employee.findByIdAndUpdate(req.params.id, { status: false });
    req.flash('success', 'ลบพนักงานสำเร็จ!');
    res.redirect('/employees');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/employees');
  }
});

module.exports = router;