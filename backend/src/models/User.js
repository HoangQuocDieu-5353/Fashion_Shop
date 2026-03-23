const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Vui lòng cung cấp họ tên'],
      trim: true,
      minlength: [2, 'Họ tên phải tối thiểu 2 ký tự'],
      maxlength: [100, 'Họ tên không được vượt quá 100 ký tự'],
    },
    email: {
      type: String,
      required: [true, 'Vui lòng cung cấp email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Vui lòng cung cấp email hợp lệ',
      ],
    },
    password: {
      type: String,
      required: [true, 'Vui lòng cung cấp mật khẩu'],
      minlength: [8, 'Mật khẩu phải tối thiểu 8 ký tự'], // Đã nâng lên 8 cho bảo mật
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'admin'],
        message: 'Vai trò phải là customer hoặc admin',
      },
      default: 'customer',
    },
    avatar: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // 🚀 PHẦN THÊM MỚI: QUẢN LÝ QUÊN MẬT KHẨU
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// ========== MIDDLEWARE HOOKS ==========
// Tự động mã hóa mật khẩu trước khi lưu vào DB
userSchema.pre('save', async function () {
  // 1. Nếu mật khẩu không bị thay đổi thì thoát luôn, không làm gì cả
  if (!this.isModified('password')) return;

  try {
    // 2. Tạo muối (salt) và mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

  } catch (error) {
    throw new Error(`Lỗi mã hóa mật khẩu: ${error.message}`);
  }
});

// ========== INSTANCE METHODS ==========
// Kiểm tra mật khẩu khi đăng nhập
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    throw new Error(`Lỗi so sánh mật khẩu: ${error.message}`);
  }
};

// Loại bỏ thông tin nhạy cảm khi trả về JSON cho Client
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.isDeleted;
  delete obj.deletedAt;
  return obj;
};

module.exports = mongoose.model('User', userSchema);