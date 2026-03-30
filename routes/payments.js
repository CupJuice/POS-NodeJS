const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Sale = require('../models/Sale');
const Member = require('../models/Member');

// Process payment
router.post('/', async (req, res) => {
  try {
    const { saleId, paymentMethods, cashReceived } = req.body;

    const sale = await Sale.findById(saleId).populate('member');
    if (!sale) throw new Error('ไม่พบรายการขาย');
    if (sale.status !== 'pending') throw new Error('รายการนี้ถูกดำเนินการแล้ว');

    const methods = JSON.parse(paymentMethods);
    const totalPaid = methods.reduce((sum, m) => sum + m.amount, 0);

    if (totalPaid < sale.totalAmount) throw new Error('จำนวนเงินไม่พอ');

    const cashAmt = parseFloat(cashReceived) || 0;
    const change = Math.max(0, cashAmt - sale.totalAmount);

    // ✅ ลบ countDocuments ออก — ให้ pre('save') ใน Payment model จัดการเอง
    const payment = new Payment({
      sale: sale._id,
      saleNumber: sale.saleNumber,
      totalAmount: sale.totalAmount,
      paymentMethods: methods,
      cashReceived: cashAmt,
      changeAmount: change,
      status: 'completed'
    });

    await payment.save();

    // Update sale status
    sale.status = 'completed';
    const pointsEarned = Math.floor(sale.totalAmount / 10);
    sale.pointsEarned = pointsEarned;
    await sale.save();

    // Update member points and spending
    if (sale.member) {
      await Member.findByIdAndUpdate(sale.member._id, {
        $inc: { points: pointsEarned, totalSpent: sale.totalAmount }
      });
    }

    res.json({
      success: true,
      paymentNumber: payment.paymentNumber,
      changeAmount: change,
      pointsEarned
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// List payments
router.get('/', async (req, res) => {
  try {
    const { dateFrom, dateTo, page = 1 } = req.query;
    const limit = 15;
    const query = {};
    if (dateFrom || dateTo) {
      query.paymentDate = {};
      if (dateFrom) query.paymentDate.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate({ path: 'sale', populate: { path: 'employee', select: 'firstName lastName' } })
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalRevenue = await Payment.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.render('payments/index', {
      title: 'ประวัติการชำระเงิน',
      payments, dateFrom: dateFrom || '', dateTo: dateTo || '',
      currentPage: parseInt(page), totalPages: Math.ceil(total / limit),
      total, totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/');
  }
});

// Refund
router.post('/:id/refund', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('sale');
    if (!payment) throw new Error('ไม่พบการชำระเงิน');

    payment.status = 'refunded';
    await payment.save();

    payment.sale.status = 'refunded';
    await payment.sale.save();

    // Restore stock
    const Sale = require('../models/Sale');
    const sale = await Sale.findById(payment.sale._id);
    const Product = require('../models/Product');
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    // คืน points สมาชิก
    if (sale.member && sale.pointsEarned > 0) {
      const Member = require('../models/Member');
      await Member.findByIdAndUpdate(sale.member._id, {
        $inc: { points: -sale.pointsEarned, totalSpent: -sale.totalAmount }
      });
    }

    req.flash('success', 'คืนเงินสำเร็จ');
    res.redirect('/payments');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/payments');
  }
});

module.exports = router;