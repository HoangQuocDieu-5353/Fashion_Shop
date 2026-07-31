const Wishlist = require('../models/Wishlist');

// 1. LẤY DANH SÁCH (Dùng để hiện ở trang Wishlist)
const getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    // Populate để lấy luôn thông tin sản phẩm (tên, giá, ảnh...)
    const wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: 'products',
      select: 'name price images category stock', // Chỉ lấy các trường cần thiết
      populate: { path: 'category', select: 'name' }
    });

    return res.status(200).json({ 
      success: true, 
      data: wishlist ? wishlist.products : [] 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. TOGGLE (Bấm 1 cái là thêm, bấm cái nữa là xóa)
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;

    // Tìm xem user đã có wishlist chưa
    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      // Chưa có thì tạo mới và thêm sản phẩm luôn
      wishlist = await Wishlist.create({ user: userId, products: [productId] });
      return res.status(200).json({ success: true, message: "Đã thêm vào yêu thích", isFavorite: true });
    }

    // Nếu đã có, kiểm tra xem sản phẩm có trong mảng chưa
    const isExist = wishlist.products.includes(productId);

    if (isExist) {
      // Có rồi thì dùng $pull để XÓA
      await Wishlist.updateOne({ user: userId }, { $pull: { products: productId } });
      return res.status(200).json({ success: true, message: "Đã xóa khỏi yêu thích", isFavorite: false });
    } else {
      // Chưa có thì dùng $addToSet để THÊM
      await Wishlist.updateOne({ user: userId }, { $addToSet: { products: productId } });
      return res.status(200).json({ success: true, message: "Đã thêm vào yêu thích", isFavorite: true });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getWishlist, toggleWishlist };