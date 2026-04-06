const Review = require('../models/Review');
const Order = require('../models/Order'); // Dùng để check xem đã mua hàng chưa (nếu cần)
const User = require('../models/User');
const Product = require('../models/Product'); // 🚀 Thêm để lấy tên SP
const { createNotification } = require('../utils/notificationHelper');
// 1. LẤY DANH SÁCH ĐÁNH GIÁ CỦA SẢN PHẨM
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Tìm tất cả review của sản phẩm này, lấy luôn thông tin người đánh giá và người reply
    const reviews = await Review.find({ product: productId })
      .populate('user', 'fullName avatar') // Lấy tên và avatar của người đánh giá gốc
      .populate('replies.user', 'fullName avatar role') // Lấy tên, avatar, role (để biết là Admin hay User) của người reply
      .sort({ createdAt: -1 }); // Mới nhất xếp lên đầu

    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy đánh giá' });
  }
};

// 2. TẠO ĐÁNH GIÁ GỐC (A: "Áo đẹp vl")
const createReview = async (req, res) => {
  try {
    const { productId, rating, content } = req.body;
    const userId = req.user._id;

    const existingReview = await Review.findOne({ product: productId, user: userId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi!' });
    }

    const newReview = await Review.create({ product: productId, user: userId, rating, content });
    
    // 🚀 THÔNG BÁO CHO ADMIN
    const product = await Product.findById(productId);
    const admin = await User.findOne({ role: 'admin' });
    
    if (admin) {
      await createNotification(global.io, {
        userId: admin._id,
        title: 'Đánh giá sản phẩm mới ⭐',
        message: `Khách ${req.user.fullName} vừa đánh giá ${rating} sao cho sản phẩm "${product?.name}".`,
        type: 'SYSTEM', // Hoặc PROMOTION tùy ông giáo
        link: `/admin/reviews`,
        relatedId: newReview._id
      });
    }

    return res.status(201).json({ success: true, message: 'Đánh giá thành công', data: newReview });
  } catch (error) {
    console.error(error); // In lỗi ra Terminal của VS Code để soi
    return res.status(500).json({ 
        success: false, 
        message: error.message // Cho Postman hiện thẳng nội dung lỗi
    });
  }
};

// 3. TẠO REPLY (B/Admin: "Vậy mua đi")
const addReply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Tìm review gốc để lấy ID người cần nhận thông báo
    const originalReview = await Review.findById(reviewId).populate('product', 'name');
    if (!originalReview) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });

    // Update thêm reply
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $push: { replies: { user: userId, content: content } } },
      { new: true }
    ).populate('replies.user', 'fullName avatar role');

    // 🚀 THÔNG BÁO CHO NGƯỜI VIẾT ĐÁNH GIÁ GỐC
    // Chỉ gửi nếu người trả lời KHÔNG PHẢI là chính chủ bài viết
    if (originalReview.user.toString() !== userId.toString()) {
      await createNotification(global.io, {
        userId: originalReview.user, // Chủ nhân của comment "Áo đẹp vl"
        title: 'Phản hồi từ FashionShop 💬',
        message: `Shop đã phản hồi đánh giá của bạn về sản phẩm "${originalReview.product?.name}". Xem ngay nhé!`,
        type: 'SYSTEM',
        link: `/products/${originalReview.product?._id}`,
        relatedId: originalReview._id
      });
    }

    return res.status(200).json({ success: true, message: 'Trả lời thành công', data: updatedReview });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi trả lời' });
  }
};

// 4. LẤY TẤT CẢ ĐÁNH GIÁ CỦA TOÀN BỘ WEB (ADMIN)
const getAllReviewsAdmin = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'fullName email avatar') // Lấy thông tin người bình luận
      .populate('product', 'name images')    // Lấy tên và ảnh sản phẩm để admin biết nó chửi cái áo nào
      .populate('replies.user', 'fullName role') // Lấy thông tin người trả lời
      .sort({ createdAt: -1 }); // Mới nhất lên đầu

    return res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách đánh giá Admin:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// 5. XÓA ĐÁNH GIÁ (ADMIN)
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá này' });
    }

    return res.status(200).json({ success: true, message: 'Đã xóa đánh giá thành công' });
  } catch (error) {
    console.error('Lỗi xóa đánh giá Admin:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

module.exports = { getProductReviews, createReview, addReply,getAllReviewsAdmin, deleteReview   };