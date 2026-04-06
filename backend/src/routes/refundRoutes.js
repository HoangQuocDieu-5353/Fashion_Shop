const express = require('express');
const router = express.Router();
const multer = require('multer'); // 🚀 Thêm cái này
const path = require('path');   // 🚀 Thêm cái này

// Import các hàm xử lý từ Controller
const { 
  createRefundRequest, 
  getMyRefunds, 
  getAllRefunds, 
  getRefundById, 
  updateRefundStatus 
} = require('../controllers/refundController');

const { protect, admin } = require('../middlewares/authMiddleware');

// ===== 🚀 CẤU HÌNH MULTER (Copy từ productRoutes) =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Vui lòng chỉ upload file hình ảnh'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ==========================================
// 🚀 ROUTES DÀNH CHO USER (KHÁCH HÀNG)
// ==========================================

router.get('/my-refunds', protect, getMyRefunds);

// SỬA DÒNG NÀY: Thêm upload.array('images') để nhận ảnh bằng chứng
router.post('/request', protect, upload.array('images', 5), createRefundRequest);

// ==========================================
// 🚀 ROUTES DÀNH CHO ADMIN (QUẢN TRỊ VIÊN)
// ==========================================

router.get('/admin/all', protect, admin, getAllRefunds);
router.get('/admin/:id', protect, admin, getRefundById);
router.patch('/admin/update/:id', protect, admin, updateRefundStatus);

module.exports = router;