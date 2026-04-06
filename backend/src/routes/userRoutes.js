const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, admin } = require('../middlewares/authMiddleware');
const {
  getMe,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
} = require('../controllers/userController');

// 🛠️ 1. Cấu hình Multer lưu ảnh vào máy local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars';
    // Tự động tạo thư mục nếu chưa có
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Đặt tên file: avatar-userId-timestamp.jpg
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// 🛠️ 2. Bộ lọc chỉ nhận file ảnh
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ được phép tải lên tệp hình ảnh!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // Giới hạn 2MB cho đỡ nặng máy
});

/**
 * ==================== USER ROUTES ====================
 */
router.get('/me', protect, getMe);

// Thêm middleware upload.single('avatar') vào đây
router.patch('/profile', protect, upload.single('avatar'), updateProfile);

router.post('/change-password', protect, changePassword);

/**
 * ==================== ADMIN ROUTES ====================
 */
router.get('/admin/all', protect, admin, getAllUsers);
router.patch('/admin/update-role/:id', protect, admin, updateUserRole);
router.patch('/admin/toggle-status/:id', protect, admin, toggleUserStatus);

module.exports = router;