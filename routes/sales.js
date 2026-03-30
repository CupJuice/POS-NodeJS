const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Member = require('../models/Member');
const Employee = require('../models/Employee');
const Payment = require('../models/Payment');

// POS Screen
router.get('/pos', async (req, res) => {
  try {
    const employees = await Employee.find({ status: true });
    const categories = await Product.distinct('category', { status: true });
    res.render('sales/pos', { title: 'หน้าขาย POS', employees, categories });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/');
  }
});

// List sales
router.get('/', async (req, res) => {
  try {
    const { search, status, dateFrom, dateTo, page = 1 } = req.query;
    const limit = 15;
    const query = {};
    if (search) {
      query.$or = [{ saleNumber: new RegExp(search, 'i') }];
    }
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.saleDate = {};
      if (dateFrom) query.saleDate.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query.saleDate.$lte = end;
      }
    }

    const total = await Sale.countDocuments(query);
    const sales = await Sale.find(query)
      .populate('employee', 'firstName lastName')
      .populate('member', 'firstName lastName memberId')
      .sort({ saleDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render('sales/index', {
      title: 'รายการขาย',
      sales, search: search || '', statusFilter: status || '',
      dateFrom: dateFrom || '', dateTo: dateTo || '',
      currentPage: parseInt(page), totalPages: Math.ceil(total / limit), total
    });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/');
  }
});

// Create sale (from POS)
router.post('/', async (req, res) => {
  try {
    const { employeeId, memberId, items, discountPercent, discountAmount, taxRate, note } = req.body;

    const parsedItems = JSON.parse(items);
    let subtotal = 0;
    const saleItems = [];

    for (const item of parsedItems) {
      const product = await Product.findById(item.productId);
      if (!product) throw new Error(`ไม่พบสินค้า: ${item.productId}`);
      if (product.stock < item.quantity) throw new Error(`สินค้า ${product.name} สต็อกไม่พอ`);

      const itemSubtotal = item.quantity * product.sellPrice;
      subtotal += itemSubtotal;

      saleItems.push({
        product: product._id,
        productName: product.name,
        productId: product.productId,
        quantity: item.quantity,
        unitPrice: product.sellPrice,
        discount: item.discount || 0,
        subtotal: itemSubtotal
      });
    }

    const discAmt = parseFloat(discountAmount) || (subtotal * (parseFloat(discountPercent) || 0) / 100);
    const afterDiscount = subtotal - discAmt;
    const tax = afterDiscount * (parseFloat(taxRate) || 7) / 100;
    const total = afterDiscount + tax;

    const sale = new Sale({
      employee: employeeId,
      member: memberId || null,
      items: saleItems,
      subtotal,
      discountAmount: discAmt,
      discountPercent: parseFloat(discountPercent) || 0,
      taxAmount: tax,
      taxRate: parseFloat(taxRate) || 7,
      totalAmount: total,
      note,
      status: 'pending'
    });

    await sale.save();

    for (const item of parsedItems) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
    }

    res.json({ success: true, saleId: sale._id, saleNumber: sale.saleNumber, totalAmount: total });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Show sale detail
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId')
      .populate('member', 'firstName lastName memberId phone')
      .populate('items.product', 'name productId');
    if (!sale) { req.flash('error', 'ไม่พบรายการขาย'); return res.redirect('/sales'); }
    const payment = await Payment.findOne({ sale: sale._id });
    res.render('sales/show', { title: `ใบเสร็จ: ${sale.saleNumber}`, sale, payment });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/sales');
  }
});

// Cancel sale
router.put('/:id/cancel', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (sale.status !== 'pending') throw new Error('ไม่สามารถยกเลิกรายการนี้ได้');
    sale.status = 'cancelled';
    await sale.save();
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
    req.flash('success', 'ยกเลิกรายการสำเร็จ');
    res.redirect('/sales');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/sales');
  }
});

module.exports = router;