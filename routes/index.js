const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Member = require('../models/Member');
const Employee = require('../models/Employee');
const Payment = require('../models/Payment');
const moment = require('moment');

router.get('/', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [todaySales, totalProducts, totalMembers, totalEmployees, lowStockProducts, recentSales] = await Promise.all([
      Sale.aggregate([
        { $match: { saleDate: { $gte: startOfDay, $lte: endOfDay }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Product.countDocuments({ status: true }),
      Member.countDocuments({ status: true }),
      Employee.countDocuments({ status: true }),
      Product.find({ status: true }).then(products => products.filter(p => p.stock <= p.minStock).slice(0, 5)),
      Sale.find({ status: 'completed' }).sort({ saleDate: -1 }).limit(5).populate('employee', 'firstName lastName')
    ]);

    // Monthly sales for chart (last 6 months)
    const sixMonthsAgo = moment().subtract(5, 'months').startOf('month').toDate();
    const monthlySales = await Sale.aggregate([
      { $match: { saleDate: { $gte: sixMonthsAgo }, status: 'completed' } },
      { $group: { _id: { month: { $month: '$saleDate' }, year: { $year: '$saleDate' } }, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.render('index', {
      title: 'หน้าหลัก - POS System',
      todaySales: todaySales[0] || { total: 0, count: 0 },
      totalProducts,
      totalMembers,
      totalEmployees,
      lowStockProducts,
      recentSales,
      monthlySales: JSON.stringify(monthlySales)
    });
  } catch (err) {
    console.error(err);
    res.render('index', {
      title: 'หน้าหลัก - POS System',
      todaySales: { total: 0, count: 0 },
      totalProducts: 0, totalMembers: 0, totalEmployees: 0,
      lowStockProducts: [], recentSales: [], monthlySales: '[]'
    });
  }
});

module.exports = router;