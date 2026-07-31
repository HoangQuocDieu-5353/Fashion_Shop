const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: { // Đẩy SKU xuống đây là chuẩn xác 100%
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // Ép chữ hoa cho chuyên nghiệp
    },
    size: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    price: { 
      // Chỉ dùng khi size XL đắt hơn size S. Nếu null thì lấy 'price' ở Product
      type: Number,
      default: null, 
    },
    image: {
      // Ảnh riêng cho màu sắc (Khách chọn màu Đen thì nhảy ảnh áo Đen)
      type: String,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ProductVariant', variantSchema);