const express = require('express');
const {
  getCategories,
  getCategoryDetail,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, admin } = require('../middlewares/authMiddleware');

const router = express.Router();

// ===== ĐỊNH NGHĨA CÁC ENDPOINT =====

/**
 * GET /api/categories
 * Lấy danh sách tất cả danh mục
 */
router.get('/', getCategories);

/**
 * GET /api/categories/slug/:slug
 * Lấy danh mục theo slug
 * Route này phải đặt TRƯỚC route /:id để tránh xung đột
 */
router.get('/slug/:slug', getCategoryBySlug);

/**
 * GET /api/categories/:id
 * Lấy chi tiết danh mục theo ID
 */
router.get('/:id', getCategoryDetail);

/**
 * POST /api/categories
 * Tạo danh mục mới
 * Middleware: protect (xác thực), admin (kiểm tra quyền)
 * @access Private/Admin
 */
router.post('/', protect, admin, createCategory);

/**
 * PUT /api/categories/:id
 * Cập nhật thông tin danh mục
 * Middleware: protect (xác thực), admin (kiểm tra quyền)
 * @access Private/Admin
 */
router.put('/:id', protect, admin, updateCategory);

/**
 * DELETE /api/categories/:id
 * Xóa danh mục
 * Middleware: protect (xác thực), admin (kiểm tra quyền)
 * @access Private/Admin
 */
router.delete('/:id', protect, admin, deleteCategory);

// Xuất router
module.exports = router;
