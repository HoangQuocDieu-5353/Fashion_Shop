const mongoose = require('mongoose');

// Schema giỏ hàng
const cartSchema = new mongoose.Schema(
  {
    // Liên kết với người dùng
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Danh sách sản phẩm trong giỏ
    items: [
      {
        // Sản phẩm tham chiếu
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },

        // Số lượng sản phẩm
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },

        // Kích cỡ sản phẩm
        size: {
          type: String,
          required: true,
        },

        // Màu sắc sản phẩm
        color: {
          type: String,
          required: true,
        },
      },
    ],

    // Cờ xóa mềm
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // Thời gian xóa
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

module.exports = mongoose.model('Cart', cartSchema);
