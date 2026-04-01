const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    // Mã code khách nhập (VD: SALE50K, FREESHIP)
    code: {
      type: String,
      required: [true, 'Vui lòng nhập mã giảm giá'],
      unique: true,
      trim: true,
      uppercase: true, // Tự động viết hoa để khách nhập sao cũng ăn
    },
    // Loại giảm giá: Theo phần trăm (%) hoặc trừ thẳng tiền mặt (VNĐ)
    discountType: {
      type: String,
      enum: ['percent', 'fixed'],
      default: 'percent',
    },
    // Giá trị giảm (VD: 10 cho 10%, hoặc 50000 cho 50.000đ)
    discountValue: {
      type: Number,
      required: [true, 'Vui lòng nhập giá trị giảm'],
    },
    // Số tiền giảm tối đa (Dành cho loại 'percent'. VD: Giảm 10% nhưng tối đa 50k)
    maxDiscount: {
      type: Number,
      default: null,
    },
    // Đơn hàng tối thiểu mới được dùng (VD: Mua từ 200k mới được áp mã)
    minOrderValue: {
      type: Number,
      default: 0,
    },
    // Ngày bắt đầu hiệu lực
    startDate: {
      type: Date,
      default: Date.now,
    },
    // Ngày hết hạn
    endDate: {
      type: Date,
      required: [true, 'Vui lòng chọn ngày hết hạn'],
    },
    // TỔNG số lượng mã được tung ra (VD: Chỉ cấp 100 mã cho toàn hệ thống)
    usageLimit: {
      type: Number,
      default: null, // Nếu để null là không giới hạn số lượng
    },
    // Đã có bao nhiêu người xài rồi (Dùng để check xem mã đã cạn chưa)
    usedCount: {
      type: Number,
      default: 0,
    },
    // Trạng thái bật/tắt (Để Admin chủ động dừng chương trình sớm)
    isActive: {
      type: Boolean,
      default: true,
    },
    // 🚀 CHỐNG BÀO: Danh sách những User đã sử dụng mã này
    usedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);