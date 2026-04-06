const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  addToCart,
  getCart,
  updateQuantity,
  removeItem,
  clearCart,
} = require('../controllers/cartController');

/**
 * GET /api/carts
 * Lấy thông tin giỏ hàng của người dùng đang đăng nhập
 * @access Private
 */
router.get('/', protect, getCart);

/**
 * POST /api/carts/add
 * Thêm sản phẩm vào giỏ hàng
 * @access Private
 */
router.post('/add', protect, addToCart);

/**
 * PUT /api/carts/update/:itemId
 * Cập nhật số lượng sản phẩm trong giỏ hàng
 * @access Private
 */
router.put('/update/:itemId', protect, updateQuantity);

/**
 * DELETE /api/carts/remove/:itemId
 * Xóa một sản phẩm khỏi giỏ hàng
 * @access Private
 */
router.delete('/remove/:itemId', protect, removeItem);

/**
 * DELETE /api/carts/clear
 * Xóa sạch giỏ hàng
 * @access Private
 */
router.delete('/clear', protect, clearCart);

module.exports = router;
