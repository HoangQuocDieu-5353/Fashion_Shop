const express = require('express');
const router = express.Router();
const { 
  getProductReviews, 
  createReview, 
  addReply,
  getAllReviewsAdmin,
  deleteReview
} = require('../controllers/reviewController');

// Import 2 cái khiên bảo vệ của ông giáo
const { protect, admin } = require('../middlewares/authMiddleware'); 

// ==========================================
// ROUTES CHO USER THƯỜNG
// ==========================================
router.get('/product/:productId', getProductReviews);
router.post('/', protect, createReview);
router.post('/:reviewId/reply', protect, addReply);

// ==========================================
// ROUTES ĐỘC QUYỀN CHO ADMIN
// ==========================================
// Lấy toàn bộ bình luận (Phải login + Phải là Admin)
router.get('/admin/all', protect, admin, getAllReviewsAdmin);

// Xóa bình luận (Phải login + Phải là Admin)
router.delete('/:id', protect, admin, deleteReview);

module.exports = router;