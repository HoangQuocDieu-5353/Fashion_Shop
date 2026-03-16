const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware xác thực Token từ Header
 * Kiểm tra JWT Token để biết ai đang truy cập
 * Token nên được gửi qua Header: Authorization: Bearer <token>
 * @access Private
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Lấy token từ Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Kiểm tra xem token có tồn tại không
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng cung cấp token để truy cập',
        data: null,
      });
    }

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Tìm người dùng theo ID từ token
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại',
        data: null,
      });
    }

    // Lưu thông tin người dùng vào req.user để sử dụng ở route handler
    req.user = user;
    next();
  } catch (error) {
    console.error('Lỗi xác thực token:', error.message);

    // Kiểm tra nếu token hết hạn
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn. Vui lòng đăng nhập lại',
        data: null,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ',
      data: null,
    });
  }
};

/**
 * Middleware kiểm tra vai trò Admin
 * Chỉ cho phép truy cập nếu người dùng là admin
 * Phải được sử dụng SAU middleware protect
 * @access Private/Admin
 */
const admin = (req, res, next) => {
  try {
    // Kiểm tra xem người dùng có tồn tại không (từ middleware protect)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng xác thực trước',
        data: null,
      });
    }

    // Kiểm tra nếu role của người dùng là 'admin'
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tài nguyên này. Chỉ admin được phép',
        data: null,
      });
    }

    next();
  } catch (error) {
    console.error('Lỗi kiểm tra quyền admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi kiểm tra quyền',
      data: null,
    });
  }
};

// Xuất các middleware
module.exports = {
  protect,
  admin,
};
