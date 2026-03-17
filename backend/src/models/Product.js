const mongoose = require('mongoose');

// Schema sản phẩm quần áo
const productSchema = new mongoose.Schema(
  {
    // Tên sản phẩm
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Giá sản phẩm
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Mô tả chi tiết sản phẩm
    description: {
      type: String,
      required: true,
    },

    // Danh mục sản phẩm - Tham chiếu tới model Category
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    // Mảng kích cỡ có sẵn (ví dụ: XS, S, M, L, XL, XXL)
    sizes: {
      type: [String],
      required: true,
    },

    // Mảng màu sắc có sẵn (ví dụ: đen, trắng, đỏ, ...)
    colors: {
      type: [String],
      required: true,
    },

    // Số lượng hàng trong kho
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // Mảng đường dẫn ảnh sản phẩm
    images: {
      type: [String],
      default: [],
    },

    // Ảnh đại diện chính của sản phẩm
    mainImage: {
      type: String,
      required: false,
    },

    // Cấu trúc xóa mềm - Cờ đánh dấu sản phẩm đã bị xóa
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // Thời gian xóa mềm
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    // Tự động thêm timestamps: createdAt, updatedAt
    timestamps: true,
  }
);

// Xuất model Product
module.exports = mongoose.model('Product', productSchema);