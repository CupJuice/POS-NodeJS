const express = require('express');
const router = express.Router();
const Member = require('../models/Member');

// Search member by phone (for POS)
router.get('/search', async (req, res) => {
  try {
    const { phone } = req.query;
    const member = await Member.findOne({ phone, status: true });
    if (!member) return res.status(404).json({ error: 'ไม่พบสมาชิก' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all members
router.get('/', async (req, res) => {
  try {
    const { search, level, status, page = 1 } = req.query;
    const limit = 10;
    const query = {};

    if (search) {
      query.$or = [
        { memberId: new RegExp(search, 'i') },
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }
    if (level) query.level = level;
    if (status !== undefined && status !== '') query.status = status === 'true';

    const total = await Member.countDocuments(query);
    const members = await Member.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render('members/index', {
      title: 'จัดการสมาชิก',
      members,
      search: search || '',
      levelFilter: level || '',
      statusFilter: status || '',
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด: ' + err.message);
    res.redirect('/');
  }
});

// New member form
router.get('/new', (req, res) => {
  res.render('members/new', { title: 'เพิ่มสมาชิกใหม่', member: {} });
});

// Create member
router.post('/', async (req, res) => {
  try {
    const member = new Member(req.body);
    await member.save();
    req.flash('success', 'เพิ่มสมาชิกสำเร็จ!');
    res.redirect('/members');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด: ' + (err.code === 11000 ? 'เบอร์โทรศัพท์นี้มีในระบบแล้ว' : err.message));
    res.render('members/new', { title: 'เพิ่มสมาชิกใหม่', member: req.body });
  }
});

// Show member detail
router.get('/:id', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) { req.flash('error', 'ไม่พบข้อมูลสมาชิก'); return res.redirect('/members'); }
    const Sale = require('../models/Sale');
    const purchaseHistory = await Sale.find({ member: req.params.id, status: 'completed' }).sort({ saleDate: -1 }).limit(10);
    res.render('members/show', { title: `สมาชิก: ${member.firstName} ${member.lastName}`, member, purchaseHistory });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/members');
  }
});

// Edit form
router.get('/:id/edit', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) { req.flash('error', 'ไม่พบข้อมูลสมาชิก'); return res.redirect('/members'); }
    res.render('members/edit', { title: 'แก้ไขข้อมูลสมาชิก', member });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/members');
  }
});

// Update member
router.put('/:id', async (req, res) => {
  try {
    await Member.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    req.flash('success', 'อัพเดทข้อมูลสมาชิกสำเร็จ!');
    res.redirect('/members');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด: ' + err.message);
    res.redirect('/members/' + req.params.id + '/edit');
  }
});

// Delete member
router.delete('/:id', async (req, res) => {
  try {
    await Member.findByIdAndUpdate(req.params.id, { status: false });
    req.flash('success', 'ลบสมาชิกสำเร็จ!');
    res.redirect('/members');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/members');
  }
});

module.exports = router;