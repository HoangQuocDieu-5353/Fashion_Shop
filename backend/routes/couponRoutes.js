const express = require('express');
const router = express.Router();
// 🚀 Lưu ý: Kiểm tra tên thư mục là 'middlewares' hay 'middleware' để tránh lỗi 500 nhé
const { protect, admin } = require('../middlewares/authMiddleware'); 

const {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  getAvailableCoupons 
} = require('../controllers/couponController');

// ==========================================
// ROUTES CHO KHÁCH HÀNG (Customer)
// ==========================================

router.get('/available', protect, getAvailableCoupons);

// Áp dụng mã giảm giá khi nhập code hoặc click chọn
router.post('/apply', protect, applyCoupon);


// ==========================================
// ROUTES CHO QUẢN TRỊ (Admin)
// ==========================================

router.get('/', protect, admin, getAllCoupons);
router.post('/', protect, admin, createCoupon);
router.put('/:id', protect, admin, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

module.exports = router;