const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['ORDER', 'PROMOTION', 'SYSTEM'], 
    default: 'ORDER' 
  },
  link: { type: String }, // Đường dẫn để khách bấm vào là bay tới trang đó (vd: /orders/123)
  isRead: { type: Boolean, default: false },
  relatedId: { type: mongoose.Schema.Types.ObjectId } // ID của đơn hàng hoặc sản phẩm liên quan
}, { timestamps: true });

// Đánh index để load thông báo mới nhất nhanh hơn
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);