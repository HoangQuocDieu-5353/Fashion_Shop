const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  createProduct,
  getProducts,
  getProductDetail,
  updateProduct,
  softDeleteProduct,
} = require('../controllers/productController');
const { protect, admin } = require('../middlewares/authMiddleware');

const router = express.Router();

// ===== CẤU HÌNH MULTER ĐỂ XỬ LÝ UPLOAD ẢNH =====
const storage = multer.diskStorage({
  // Đặt thư mục lưu ảnh
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },

  // Đặt tên file
  filename: (req, file, cb) => {
    // Tạo tên file: timestamp + tên gốc
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Cấu hình bộ lọc file - chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Vui lòng chỉ upload file hình ảnh (jpg, png, gif, webp)'), false);
  }
};

// Khởi tạo multer với cấu hình
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn kích thước file: 5MB
  },
});

// ===== ĐỊNH NGHĨA CÁC ENDPOINT =====

/**
 * GET /api/products
 * Lấy danh sách tất cả sản phẩm (chỉ những sản phẩm chưa bị xóa)
 */
router.get('/', getProducts);

/**
 * GET /api/products/:id
 * Lấy chi tiết một sản phẩm theo ID
 */
router.get('/:id', getProductDetail);

/**
 * POST /api/products
 * Tạo sản phẩm mới với hỗ trợ upload nhiều ảnh
 * Middleware: protect (xác thực), admin (kiểm tra quyền)
 * - Middleware: upload.array('images') - Chấp nhận tối đa 10 file ảnh với tên field là "images"
 * @access Private/Admin
 */
router.post('/', protect, admin, upload.array('images', 10), createProduct);

/**
 * PUT /api/products/:id
 * Cập nhật thông tin sản phẩm (có thể thêm ảnh mới)
 * Middleware: protect (xác thực), admin (kiểm tra quyền)
 * - Middleware: upload.array('images') - Chấp nhận tối đa 5 file ảnh mới
 * @access Private/Admin
 */
router.put('/:id', protect, admin, upload.array('images', 5), updateProduct);

/**
 * DELETE /api/products/:id
 * Xóa mềm sản phẩm (cập nhật isDeleted = true, không xóa thực sự)
 * Middleware: protect (xác thực), admin (kiểm tra quyền)
 * @access Private/Admin
 */
router.delete('/:id', protect, admin, softDeleteProduct);

// Xuất router
module.exports = router;
