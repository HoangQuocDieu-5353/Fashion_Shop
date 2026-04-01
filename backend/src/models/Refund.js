const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
    quantity: Number,
    price: Number
  }],
  reason: {
    type: String,
    required: true,
    enum: ['Sản phẩm lỗi', 'Giao sai mẫu', 'Không vừa size', 'Khác']
  },
  description: String,
  images: [String], // URL ảnh bằng chứng
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
    default: 'Pending'
  },
  adminNote: String,
  totalRefundAmount: Number
}, { timestamps: true });

module.exports = mongoose.model('Refund', refundSchema);