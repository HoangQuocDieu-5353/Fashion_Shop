const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên danh mục là bắt buộc'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Đảm bảo KHÔNG để required: true ở đây vì mình tự tạo slug
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * SỬA LỖI TẠI ĐÂY: Dùng 'validate' thay vì 'save'
 * Mongoose sẽ chạy hàm này TRƯỚC KHI kiểm tra các ràng buộc dữ liệu
 */
// backend/src/models/Category.js

// 🚀 Chuyển sang async function và xóa tham số next
categorySchema.pre('validate', async function () { 
  if (this.name && (this.isModified('name') || !this.slug)) {
    try {
      this.slug = slugify(this.name, {
        lower: true,
        strict: true,
        locale: 'vi',
        replacement: '-',
      });
    } catch (error) {
      // Mongoose sẽ bắt lỗi này và trả về cho controller
      throw new Error('Lỗi khi tạo slug cho danh mục');
    }
  }
  // 🚀 Tuyệt đối không gọi next() ở đây nữa
});

module.exports = mongoose.model('Category', categorySchema);