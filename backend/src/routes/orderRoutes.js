  const express = require('express');
  const router = express.Router();
  const { protect, admin } = require('../middlewares/authMiddleware');
  const {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    updateOrderStatus,
    getDashboardStats,
  } = require('../controllers/orderController');

  /**
   * POST /api/orders/create
   * Tạo đơn hàng từ giỏ hàng
   * @access Private
   */
  router.post('/create', protect, createOrder);

  /**
   * GET /api/orders/my-orders
   * Lấy danh sách đơn hàng của người dùng đang đăng nhập
   * @access Private
   */
  router.get('/my-orders', protect, getMyOrders);

  /**
   * GET /api/orders/:orderId
   * Lấy chi tiết một đơn hàng cụ thể
   * @access Private
   */
  router.get('/:orderId', protect, getOrderById);

  /**
   * PATCH /api/orders/cancel/:orderId
   * Hủy đơn hàng
   * @access Private
   */
  router.patch('/cancel/:orderId', protect, cancelOrder);

  /**
   * ==================================
   * ROUTES DÀNH CHO ADMIN
   * ==================================
   */

  /**
   * GET /api/orders/admin/all-orders
   * Lấy tất cả đơn hàng trong hệ thống
   * @access Private/Admin
   */
  router.get('/admin/all-orders', protect, admin, getAllOrders);

  /**
   * GET /api/orders/admin/dashboard-stats
   * Lấy thống kê dashboard
   * @access Private/Admin
   */
  router.get('/admin/dashboard-stats', protect, admin, getDashboardStats);

  /**
   * PATCH /api/orders/admin/update-status/:orderId
   * Cập nhật trạng thái đơn hàng
   * @access Private/Admin
   */
  router.patch('/admin/update-status/:orderId', protect, admin, updateOrderStatus);

  module.exports = router;
