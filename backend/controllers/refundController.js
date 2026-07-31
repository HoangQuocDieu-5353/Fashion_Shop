const Refund = require('../models/Refund');
const Order = require('../models/Order');
const Notification = require('../models/Notification'); // 🚀 Import Model 11

//  USER: Gửi yêu cầu đổi trả
exports.createRefundRequest = async (req, res) => {
  try {
    // 1. Lấy dữ liệu từ body
    const { orderId, reason, description } = req.body;
    
    // 2. Lấy danh sách ảnh từ Multer (nếu có)
    const imagePaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    // 3. Tìm đơn hàng của chính User đó
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    
    if (!order || order.status !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'Đơn hàng không đủ điều kiện đổi trả.' });
    }

    // 4. Kiểm tra xem đã gửi yêu cầu trước đó chưa (Chống spam)
    const existingRefund = await Refund.findOne({ order: orderId });
    if (existingRefund) {
      return res.status(400).json({ success: false, message: 'Đã có yêu cầu trước đó! Vui lòng chờ xử lý.' });
    }

    // 5. Lấy items từ đơn hàng để tính tiền hoàn (An toàn tuyệt đối)
    const itemsToRefund = order.items; 
    const totalRefundAmount = itemsToRefund.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 6. Tạo bản ghi Refund
    const refund = await Refund.create({
      order: orderId,
      user: req.user._id,
      items: itemsToRefund,
      reason,
      description,
      images: imagePaths,
      totalRefundAmount
    });

    // 7. Cập nhật trạng thái đơn hàng sang "Yêu cầu trả hàng"
    order.status = 'Return Requested';
    await order.save();

    // 🔔 8. TẠO THÔNG BÁO CHO ADMIN (Đoạn này bị thiếu nè bro!)
    // 🔔 8. TẠO THÔNG BÁO (Dùng ID của chính người đang đăng nhập)
    const adminNotify = await Notification.create({
    user: req.user._id, // ✅ Lấy ID từ user đã đăng nhập qua middleware protect
    type: 'SYSTEM',
    title: 'Yêu cầu đổi trả mới 📦',
    message: `Khách hàng ${req.user.fullName} vừa gửi yêu cầu đổi trả cho đơn hàng #${order._id.toString().slice(-6)}.`,
    link: '/admin/refunds'
    });
    
    // 9. Bắn Real-time nếu có socket
    if (global.io) {
      global.io.emit('new_notification', adminNotify); 
    }

    res.status(201).json({ success: true, data: refund });
  } catch (error) {
    console.error("Lỗi Refund:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🚀 ADMIN: Duyệt hoặc Từ chối yêu cầu
// 🚀 ADMIN: Duyệt hoặc Từ chối yêu cầu (Đã thêm Real-time Update UI)
exports.updateRefundStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    
    // 1. Tìm Refund và lấy thông tin User
    const refund = await Refund.findById(req.params.id).populate('user');
    if (!refund) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu.' });

    refund.status = status;
    refund.adminNote = adminNote;
    await refund.save();

    // 2. Đồng bộ trạng thái đơn hàng
    const order = await Order.findById(refund.order);
    if (order) {
        if (status === 'Approved') order.status = 'Refund Processing';
        if (status === 'Rejected') order.status = 'Delivered'; 
        if (status === 'Completed') order.status = 'Returned'; 
        await order.save();

        // 🚀 DÒNG CODE "PHÉP THUẬT": Cập nhật UI cho khách ngay lập tức
        if (global.io) {
          global.io.to(refund.user._id.toString()).emit('order_status_updated', {
            orderId: order._id,
            newStatus: order.status
          });
        }
    }

    // 3. 🔔 SOẠN THÔNG BÁO "CÓ TÂM" CHO USER
    let notifyTitle = '';
    let notifyMessage = '';

    if (status === 'Approved') {
      notifyTitle = 'Yêu cầu đổi trả đã được chấp nhận ✅';
      notifyMessage = `Chào ${refund.user.fullName} ơi, Shop rất tiếc về sự cố này. Yêu cầu đổi trả đơn #${order._id.toString().slice(-6)} đã được phê duyệt. Vui lòng kiểm tra hướng dẫn gửi hàng nhé!`;
    } 
    else if (status === 'Rejected') {
      notifyTitle = 'Phản hồi về yêu cầu đổi trả ⚠️';
      notifyMessage = `Shop đã ghi nhận tình trạng bạn gửi, nhưng rất tiếc sản phẩm chưa đủ điều kiện đổi trả theo quy định của cửa hàng. Rất mong bạn thấu hiểu cho Shop về sự bất tiện này.`;
    } 
    else if (status === 'Completed') {
      notifyTitle = 'Hoàn tất hoàn tiền thành công 🎉';
      notifyMessage = `Tin vui! Shop đã nhận được hàng và hoàn tất thủ tục hoàn tiền cho đơn hàng #${order._id.toString().slice(-6)}. Cảm ơn bạn đã tin tưởng và kiên nhẫn chờ đợi Shop.`;
    }

    // 4. Lưu thông báo vào DB
    const userNotify = await Notification.create({
      user: refund.user._id,
      type: 'ORDER',
      title: notifyTitle,
      message: notifyMessage,
      link: '/profile/orders'
    });

    // 5. 🚀 Bắn thông báo Realtime (Chuông báo)
    if (global.io) {
      global.io.to(refund.user._id.toString()).emit('new_notification', userNotify);
    }

    res.status(200).json({ success: true, message: `Đã cập nhật & gửi thông báo: ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🚀 USER: Lấy danh sách đổi trả cá nhân
exports.getMyRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find({ user: req.user._id })
      .populate('order', 'totalAmount status createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: refunds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🚀 ADMIN: Lấy tất cả yêu cầu trong hệ thống
exports.getAllRefunds = async (req, res) => {
  try {
    const data = await Refund.find()
      .populate('user', 'fullName email')
      .populate('order', 'totalAmount paymentMethod')
      .sort('-createdAt');
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🚀 ADMIN: Xem chi tiết 1 yêu cầu
exports.getRefundById = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id)
      .populate('user', 'fullName email phone')
      .populate('order');
      
    if (!refund) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu đổi trả.' });
    }
    res.status(200).json({ success: true, data: refund });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};