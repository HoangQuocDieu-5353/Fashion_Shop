const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // 🚀 ĐÂY LÀ ĐIỂM ĂN TIỀN: Mảng chứa tất cả các câu trả lời (Cùng 1 cấp)
    replies: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User', // Có thể là Admin hoặc User khác
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        }
      }
    ],
    // Tùy chọn: Khách mua thật mới được đánh giá
    isPurchased: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);