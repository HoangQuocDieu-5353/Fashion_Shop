const mongoose = require('mongoose');

// Schema quản lý ảnh bìa/slide trang chủ
const bannerSchema = new mongoose.Schema(
  {
    // Tiêu đề banner (hiển thị khi di chuột vào hoặc cho SEO)
    title: {
      type: String,
      required: [true, 'Vui lòng nhập tiêu đề banner'],
      trim: true,
    },
    
    // Đường dẫn ảnh (quan trọng nhất)
    imageUrl: {
      type: String,
      required: [true, 'Vui lòng upload hình ảnh banner'],
    },
    
    // Đường dẫn điều hướng khi khách bấm vào banner (Ví dụ: /products, /sale)
    linkUrl: {
      type: String,
      required: [true, 'Vui lòng nhập link điều hướng'],
      default: '#',
    },
    
    // Thứ tự hiển thị (số nhỏ hiện trước)
    sortOrder: {
      type: Number,
      default: 0,
    },
    
    // Trạng thái hiển thị (Bật/Tắt)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Tự động thêm timestamps: createdAt, updatedAt
    timestamps: true,
  }
);

// Tạo index để truy vấn theo sortOrder nhanh hơn
bannerSchema.index({ sortOrder: 1 });

module.exports = mongoose.model('Banner', bannerSchema);