const express = require('express');
const { 
  register, 
  login, 
  forgotPassword, 
  resetPassword,
  verifyEmail
} = require('../controllers/authController');

const router = express.Router();

// ===== ĐỊNH NGHĨA CÁC ENDPOINT =====

/**
 * POST /api/auth/register
 * Đăng ký tài khoản mới
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Đăng nhập với email và mật khẩu
 */
router.post('/login', login);

/**
 * 📧 POST /api/auth/forgot-password
 * Yêu cầu gửi liên kết khôi phục mật khẩu qua Email
 * @body {String} email - Email của tài khoản cần khôi phục
 */
router.post('/forgot-password', forgotPassword);

/**
 * 🔑 PUT /api/auth/reset-password/:token
 * Đặt lại mật khẩu mới bằng Token từ Email
 * @param {String} token - Token nhận được từ đường dẫn trong mail
 * @body {String} password - Mật khẩu mới (8-32 ký tự, đủ thành phần bảo mật)
 */
router.put('/reset-password/:token', resetPassword);

router.get('/verify-email/:token', verifyEmail);

module.exports = router;