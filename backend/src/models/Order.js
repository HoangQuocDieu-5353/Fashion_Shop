const mongoose = require('mongoose');

// Schema đơn hàng
const orderSchema = new mongoose.Schema(
  {
    // Liên kết với người dùng
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Danh sách sản phẩm trong đơn hàng
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

        // Giá sản phẩm tại thời điểm mua (lưu lại để không bị ảnh hưởng khi giá thay đổi)
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        subTotal: { type: Number },
        discountAmount: { type: Number, default: 0 },
        coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
      },
    ],

    // Tổng số tiền đơn hàng
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Địa chỉ giao hàng
    shippingAddress: {
      type: String,
      required: true,
      trim: true,
    },

    // Số điện thoại giao hàng
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    // Phương thức thanh toán
    paymentMethod: {
      type: String,
      enum: ['COD', 'Card'],
      default: 'COD',
      required: true,
    },

    status: {
      type: String,
      enum: [
        'Pending', 
        'Confirmed', 
        'Shipping', 
        'Delivered', 
        'Cancelled',
        // --- 3 Trạng thái mới cho nghiệp vụ Đổi Trả ---
        'Return Requested',  // Khách vừa gửi yêu cầu
        'Refund Processing', // Admin đã duyệt, đang chờ xử lý tiền/hàng
        'Returned'           // Hoàn tất quy trình đổi trả
      ],
      default: 'Pending',
    },

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

module.exports = mongoose.model('Order', orderSchema);