const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ ตั้งค่า multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'public/images/products';
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น'));
    }
  }
});

// GET all products
router.get('/', async (req, res) => {
  try {
    const { search = '', category: categoryFilter = '', lowstock = '', page = 1 } = req.query;
    const limit = 20;
    const skip = (page - 1) * limit;
    let query = {};

    if (search) query.$or = [
      { name: new RegExp(search, 'i') },
      { productId: new RegExp(search, 'i') }
    ];
    if (categoryFilter) query.category = categoryFilter;

    // แก้ lowstock query
    if (lowstock === 'true') {
      const allProducts = await Product.find({ status: true });
      const lowStockProducts = allProducts.filter(p => p.stock <= p.minStock);
      const categories = await Product.distinct('category');

      return res.render('products/index', {
        title: 'จัดการสินค้า',
        products: lowStockProducts,
        total: lowStockProducts.length,
        categories,
        search, categoryFilter, lowstockFilter: lowstock,
        currentPage: 1,
        totalPages: 1,
        canEdit: true
      });
    }

    const [products, total, categories] = await Promise.all([
      Product.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Product.countDocuments(query),
      Product.distinct('category')
    ]);

    res.render('products/index', {
      title: 'จัดการสินค้า',
      products, total, categories,
      search, categoryFilter, lowstockFilter: lowstock,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      canEdit: true
    });
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/');
  }
});

// GET search for POS
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    let query = { status: true };

    if (q.trim() !== '') {
      query.$or = [
        { name: new RegExp(q, 'i') },
        { barcode: new RegExp(q, 'i') },
        { category: new RegExp(q, 'i') },
        { productId: new RegExp(q, 'i') }
      ];
    }

    const products = await Product.find(query).limit(100);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET new
router.get('/new', async (req, res) => {
  const categories = await Product.distinct('category');
  res.render('products/new', { title: 'เพิ่มสินค้า', product: {}, categories });
});

// POST create
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (req.file) req.body.image = '/images/products/' + req.file.filename;
    if (!req.body.barcode || req.body.barcode.trim() === '') req.body.barcode = undefined;
    const product = new Product(req.body);
    await product.save();
    req.flash('success', 'เพิ่มสินค้าสำเร็จ!');
    res.redirect('/products');
  } catch (err) {
    req.flash('error', err.message);
    const categories = await Product.distinct('category');
    res.render('products/new', { title: 'เพิ่มสินค้า', product: req.body, categories });
  }
});

// GET edit
router.get('/:id/edit', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const categories = await Product.distinct('category');
    res.render('products/edit', { title: 'แก้ไขสินค้า', product, categories });
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/products');
  }
});

// PUT update
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    if (req.file) req.body.image = '/images/products/' + req.file.filename;
    if (!req.body.barcode || req.body.barcode.trim() === '') req.body.barcode = undefined;
    await Product.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    req.flash('success', 'อัพเดทสินค้าสำเร็จ!');
    res.redirect('/products');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/products/' + req.params.id + '/edit');
  }
});

// POST stock adjustment
router.post('/:id/stock', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    product.stock = Math.max(0, product.stock + parseInt(req.body.adjustment));
    await product.save();
    req.flash('success', `ปรับสต็อก "${product.name}" สำเร็จ!`);
    res.redirect('/products');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/products');
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'ไม่พบสินค้า');
      return res.redirect('/products');
    }
    await Product.findByIdAndDelete(req.params.id);
    req.flash('success', `ลบ "${product.name}" สำเร็จ!`);
    res.redirect('/products');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/products');
  }
});

module.exports = router;