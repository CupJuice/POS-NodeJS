const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const moment = require('moment');

router.get('/', (req, res) => {
  res.render('reports/index', { title: 'รายงาน' });
});

// Daily sales report
router.get('/daily', async (req, res) => {
  try {
    const date = req.query.date || moment().format('YYYY-MM-DD');
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const sales = await Sale.find({ saleDate: { $gte: start, $lte: end }, status: 'completed' })
      .populate('employee', 'firstName lastName')
      .populate('member', 'firstName lastName');

    const summary = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((s, sale) => s + sale.totalAmount, 0),
      totalDiscount: sales.reduce((s, sale) => s + sale.discountAmount, 0),
      totalTax: sales.reduce((s, sale) => s + sale.taxAmount, 0)
    };

    // Sales by hour
    const byHour = Array(24).fill(0);
    sales.forEach(sale => { byHour[new Date(sale.saleDate).getHours()] += sale.totalAmount; });

    res.render('reports/daily', { title: 'รายงานยอดขายรายวัน', date, sales, summary, byHour: JSON.stringify(byHour) });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/reports');
  }
});

// Monthly report
router.get('/monthly', async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const dailySales = await Sale.aggregate([
      { $match: { saleDate: { $gte: start, $lte: end }, status: 'completed' } },
      { $group: { _id: { $dayOfMonth: '$saleDate' }, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const topProducts = await Sale.aggregate([
      { $match: { saleDate: { $gte: start, $lte: end }, status: 'completed' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productName', totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.subtotal' } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    const totalRevenue = dailySales.reduce((s, d) => s + d.total, 0);
    const totalOrders = dailySales.reduce((s, d) => s + d.count, 0);

    res.render('reports/monthly', {
      title: 'รายงานยอดขายรายเดือน',
      month, year, dailySales: JSON.stringify(dailySales),
      topProducts, totalRevenue, totalOrders
    });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/reports');
  }
});

// Product report
router.get('/products', async (req, res) => {
  try {
    const allProducts = await Product.find({ status: true });
    const lowStockProducts = allProducts.filter(p => p.stock <= p.minStock);
    const topSellingProducts = await Sale.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.productName' }, totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.subtotal' } } },
      { $sort: { totalQty: -1 } },
      { $limit: 10 }
    ]);

    const categoryStats = await Sale.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productData' } },
      { $unwind: '$productData' },
      { $group: { _id: '$productData.category', totalRevenue: { $sum: '$items.subtotal' } } },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.render('reports/products', {
      title: 'รายงานสินค้า',
      lowStockProducts, topSellingProducts,
      categoryStats: JSON.stringify(categoryStats)
    });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/reports');
  }
});

// Member report
router.get('/members', async (req, res) => {
  try {
    const topMembers = await Sale.aggregate([
      { $match: { status: 'completed', member: { $ne: null } } },
      { $group: { _id: '$member', totalSpent: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'members', localField: '_id', foreignField: '_id', as: 'memberData' } },
      { $unwind: '$memberData' }
    ]);

    const levelStats = await Member.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]);

    const totalMembers = await Member.countDocuments({ status: true });
    const newMembersThisMonth = await Member.countDocuments({
      joinDate: { $gte: moment().startOf('month').toDate() },
      status: true
    });

    res.render('reports/members', {
      title: 'รายงานสมาชิก',
      topMembers, levelStats: JSON.stringify(levelStats),
      totalMembers, newMembersThisMonth
    });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/reports');
  }
});

module.exports = router;