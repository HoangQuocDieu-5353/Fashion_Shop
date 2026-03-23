const User = require('../models/user');
const bcrypt = require('bcryptjs');

/**
 * Lấy thông tin cá nhân của user đang đăng nhập
 * GET /api/users/me
 * @access Private
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user._id;

    // Tìm user theo ID (không lấy mật khẩu)
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin cá nhân thành công',
      data: user,
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin cá nhân:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin cá nhân',
      data: null,
    });
  }
};

/**
 * Cập nhật thông tin hồ sơ người dùng
 * PATCH /api/users/profile
 * @access Private
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, phone } = req.body;
    
    // Tìm user trước
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    // 🛠️ Xử lý đường dẫn Avatar
    let avatarUrl = user.avatar; // Mặc định giữ cái cũ
    if (req.file) {
      // Nếu có upload file mới, lưu đường dẫn tương đối
      avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    // Cập nhật các trường
    if (fullName) user.fullName = fullName.trim();
    if (phone) user.phone = phone.trim();
    user.avatar = avatarUrl;

    await user.save();

    const updatedUser = await User.findById(userId).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Lỗi cập nhật hồ sơ:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Đổi mật khẩu
 * Phải cung cấp mật khẩu cũ và mật khẩu mới
 * POST /api/users/change-password
 * @access Private
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu',
        data: null,
      });
    }

    // Kiểm tra mật khẩu mới và xác nhận khớp không
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới và xác nhận mật khẩu không khớp',
        data: null,
      });
    }

    // Kiểm tra độ dài mật khẩu mới
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
        data: null,
      });
    }

    // Lấy user (bao gồm cả password)
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại',
        data: null,
      });
    }

    // Kiểm tra mật khẩu cũ có đúng không (sử dụng phương thức matchPassword)
    const isPasswordCorrect = await user.matchPassword(oldPassword);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu cũ không đúng',
        data: null,
      });
    }

    // Kiểm tra nếu mật khẩu mới giống mật khẩu cũ
    const isSamePassword = await user.matchPassword(newPassword);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới không được giống mật khẩu cũ',
        data: null,
      });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;

    // Lưu vào database (hook pre('save') sẽ tự động mã hóa mật khẩu)
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công',
      data: null,
    });
  } catch (error) {
    console.error('Lỗi đổi mật khẩu:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đổi mật khẩu',
      data: null,
    });
  }
};
/**
 * Lấy danh sách tất cả người dùng (Admin duy nhất)
 * GET /api/users/admin/all
 * @access Private/Admin
 */
const getAllUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, role } = req.query;

    const query = { isDeleted: false }; // Không lấy người dùng đã bị xóa

    // 🔍 1. Tìm kiếm theo tên hoặc email
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // 📂 2. Lọc theo vai trò
    if (role && role !== 'All') {
      query.role = role;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(query)
      .select('-password') // Tuyệt đối không trả về mật khẩu
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalUsers = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalUsers / limitNum),
        totalUsers
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Cập nhật vai trò người dùng (Chỉ dành cho Quản trị viên)
 * PATCH /api/users/admin/update-role/:id
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    // 🚀 ĐỒNG BỘ: Chỉ nhận 'customer' hoặc 'admin'
    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vai trò không hợp lệ. Hệ thống chỉ chấp nhận "customer" hoặc "admin".' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { returnDocument: 'after' } // Sửa lỗi Warning mongoose
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật vai trò ${role === 'admin' ? 'Quản trị viên' : 'Khách hàng'} thành công.`,
      data: user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Khóa hoặc Mở khóa tài khoản (Admin duy nhất)
 * PATCH /api/users/admin/toggle-status/:id
 */
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // Đảm bảo Admin không tự khóa chính mình
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Ông giáo không thể tự khóa chính mình đâu!' });
    }

    // Giả sử ông có trường isActive trong Model, nếu không có hãy thêm vào nhé
    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Đã ${user.isActive ? 'Mở khóa' : 'Khóa'} tài khoản ${user.fullName}`,
      isActive: user.isActive
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = {
  getMe,
  updateProfile,
  changePassword,
  // Thêm các hàm admin vào export
  getAllUsers,
  updateUserRole,
  toggleUserStatus
};
