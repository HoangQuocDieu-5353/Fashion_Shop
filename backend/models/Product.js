const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { // Giữ nguyên 'name' của ông giáo để đỡ sửa Frontend nhiều
      type: String,
      required: true,
      trim: true,
    },
    slug: { // Thêm cái này theo ý thầy
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: { // Giá bán chung (Ví dụ: 350k)
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);