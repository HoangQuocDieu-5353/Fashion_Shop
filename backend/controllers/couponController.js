const Coupon = require('../models/Coupon');
const User = require('../models/User'); // 🚀 Để lấy danh sách khách hàng gửi thông báo
const { createNotification } = require('../utils/notificationHelper');

// ==========================================
// API DÀNH CHO ADMIN
// ==========================================

// 1. Lấy danh sách tất cả mã giảm giá
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách mã giảm giá', error: error.message });
  }
};

// 2. Tạo mã giảm giá mới
const createCoupon = async (req, res) => {
  try {
    const newCoupon = await Coupon.create(req.body);

    // Lấy danh sách tất cả người dùng có role là 'user'
    const users = await User.find({ role: 'customer', isActive: true }).select('_id');

      // Tạo nội dung thông báo dựa trên loại giảm giá
    const discountText = newCoupon.discountType === 'percent' 
      ? `${newCoupon.discountValue}%` 
      : `${newCoupon.discountValue.toLocaleString()}đ`;

    const promoTitle = 'Quà tặng đặc biệt từ FashionShop! 🎁';
    const promoMessage = `Nhập mã [${newCoupon.code}] để được giảm ngay ${discountText} cho đơn hàng từ ${newCoupon.minOrderValue.toLocaleString()}đ. Số lượng có hạn!`;

    // Gửi thông báo cho từng User 
    Promise.all(users.map(user => 
      createNotification(global.io, {
        userId: user._id,
        title: promoTitle,
        message: promoMessage,
        type: 'PROMOTION',
        link: '/products', 
        relatedId: newCoupon._id
      })
    ));
    
    res.status(201).json({ success: true, message: 'Tạo mã và gửi thông báo thành công', data: newCoupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá này đã tồn tại!' });
    }
    res.status(500).json({ success: false, message: 'Lỗi tạo mã giảm giá', error: error.message });
  }
};

// 3. Cập nhật mã giảm giá
const updateCoupon = async (req, res) => {
  try {
    const updatedCoupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedCoupon) return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    res.status(200).json({ success: true, message: 'Cập nhật thành công', data: updatedCoupon });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật', error: error.message });
  }
};

// 4. Xóa mã giảm giá
const deleteCoupon = async (req, res) => {
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!deletedCoupon) return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    res.status(200).json({ success: true, message: 'Đã xóa mã giảm giá' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa', error: error.message });
  }
};
// 6. Lấy danh sách coupon khả dụng cho khách hàng (Hiện ở Checkout)
const getAvailableCoupons = async (req, res) => {
  try {
    const now = new Date();
    const userId = req.user._id;

    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now }, 
      endDate: { $gte: now },
      // Chỉ lấy những mã mà User chưa từng sử dụng
      usedBy: { $ne: userId }
    }).sort({ endDate: 1 }); // Ưu tiên mã sắp hết hạn hiện lên trước

    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách coupon', error: error.message });
  }
};
// ==========================================
// API DÀNH CHO KHÁCH HÀNG (ÁP MÃ)
// ==========================================

// 5. Kiểm tra và áp dụng mã giảm giá
const applyCoupon = async (req, res) => {
  try {
    const { code, orderValue } = req.body;
    const userId = req.user._id;

    // 1. Tìm mã
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại!' });

    // 2. Check trạng thái Active
    if (!coupon.isActive) return res.status(400).json({ success: false, message: 'Mã giảm giá đã bị khóa!' });

    // 3. Check ngày hết hạn
    if (new Date() > new Date(coupon.endDate)) return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn!' });
    if (new Date() < new Date(coupon.startDate)) return res.status(400).json({ success: false, message: 'Mã giảm giá chưa đến ngày sử dụng!' });

    // 4. Check số lượng (Usage Limit)
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng!' });
    }

    // 5. Check người dùng đã xài chưa 
    if (coupon.usedBy.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Bạn đã sử dụng mã này rồi!' });
    }

    // 6. Check giá trị đơn hàng tối thiểu
    if (orderValue < coupon.minOrderValue) {
      return res.status(400).json({ success: false, message: `Đơn hàng tối thiểu phải từ ${coupon.minOrderValue.toLocaleString()}đ để áp dụng mã này!` });
    }

    // 7. Tính toán số tiền được giảm
    let discountAmount = 0;
    if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    } else if (coupon.discountType === 'percent') {
      discountAmount = (orderValue * coupon.discountValue) / 100;
      // Áp dụng mức giảm tối đa (nếu có)
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    }

    // Trả về số tiền giảm để Frontend hiển thị
    res.status(200).json({ 
      success: true, 
      message: 'Áp dụng mã thành công!',
      data: {
        couponId: coupon._id,
        code: coupon.code,
        discountAmount: discountAmount
      }
    });

  } catch (error) {
    console.error('Lỗi áp mã giảm giá:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  getAvailableCoupons
};