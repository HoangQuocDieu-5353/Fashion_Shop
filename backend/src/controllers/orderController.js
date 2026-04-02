const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Inventory = require('../models/Inventory'); 
const Coupon = require('../models/Coupon'); 
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

/**
 * Tạo đơn hàng từ giỏ hàng (ĐÃ ÁP DỤNG TRANSACTION)
 * POST /api/orders/create
 */
const createOrder = async (req, res) => {
  // 1. Khởi tạo session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { shippingAddress, phone, paymentMethod, couponId } = req.body;
    const userId = req.user._id;

    if (!shippingAddress || !phone || !paymentMethod) {
      throw new Error('MISSING_SHIPPING_INFO');
    }

    // 2. Lấy giỏ hàng (Dùng session)
    const cart = await Cart.findOne({ user: userId })
      .session(session)
      .populate('items.product')
      .populate('items.variant');

    if (!cart || cart.items.length === 0) {
      throw new Error('CART_EMPTY');
    }

    const orderItems = [];
    let subTotal = 0;

    // 3. Kiểm tra kho Inventory và chuẩn bị dữ liệu
    for (const item of cart.items) {
      if (!item.product || !item.variant) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      // Kiểm tra tồn kho thực tế (Dùng session)
      const inv = await Inventory.findOne({ variant: item.variant._id }).session(session);
      if (!inv || item.quantity > inv.stock) {
        throw new Error(`INSUFFICIENT_STOCK|${item.product.name}|${item.color}/${item.size}|${inv?.stock || 0}`);
      }

      const itemPrice = item.variant.price || item.product.price;
      subTotal += itemPrice * item.quantity;

      orderItems.push({
        product: item.product._id,
        variant: item.variant._id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: itemPrice,
      });
    }

    // 4. Xử lý Mã giảm giá (Coupon)
    let discountAmount = 0;
    let couponData = null;

    if (couponId) {
      const coupon = await Coupon.findById(couponId).session(session);
      const now = new Date();

      if (!coupon || !coupon.isActive) throw new Error('COUPON_INVALID');
      if (coupon.endDate && now > coupon.endDate) throw new Error('COUPON_EXPIRED');
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new Error('COUPON_LIMIT_REACHED');
      if (coupon.usedBy.includes(userId)) throw new Error('COUPON_ALREADY_USED');
      if (subTotal < coupon.minOrderValue) throw new Error(`MIN_ORDER_VALUE|${coupon.minOrderValue}`);

      if (coupon.discountType === 'fixed') {
        discountAmount = coupon.discountValue;
      } else {
        discountAmount = (subTotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      }
      discountAmount = Math.min(discountAmount, subTotal);
      couponData = coupon;
    }

    const totalAmount = Math.max(0, subTotal - discountAmount);

    // 5. Tạo đơn hàng mới (Dùng session)
    const order = new Order({
      user: userId,
      items: orderItems,
      subTotal,
      discountAmount,
      totalAmount,
      shippingAddress,
      phone,
      paymentMethod,
      status: 'Pending',
      coupon: couponId || null
    });

    await order.save({ session });

    // 6. Cập nhật lượt dùng Coupon (Dùng session)
    if (couponData) {
      await Coupon.findByIdAndUpdate(couponId, {
        $inc: { usedCount: 1 },
        $push: { usedBy: userId }
      }, { session });
    }

    // 7. TRỪ KHO INVENTORY (Dùng session)
    const inventoryOps = orderItems.map((item) => ({
      updateOne: {
        filter: { variant: item.variant },
        update: { 
          $inc: { 
            stock: -item.quantity,
            stockCount: item.quantity 
          } 
        },
      },
    }));
    await Inventory.bulkWrite(inventoryOps, { session });

    // 8. Xóa giỏ hàng (Dùng session)
    cart.items = [];
    await cart.save({ session });

    // ============================================================
    // CHỐT GIAO DỊCH (COMMIT)
    // ============================================================
    await session.commitTransaction();
    session.endSession();

    // ============================================================
    // SAU KHI COMMIT THÀNH CÔNG: Gửi thông báo & Alert
    // ============================================================
    setImmediate(async () => {
      for (const item of orderItems) {
        const currentInv = await Inventory.findOne({ variant: item.variant });
        if (currentInv && currentInv.stock < 5) {
          const adminForAlert = await User.findOne({ role: 'admin' });
          const productForAlert = await Product.findById(item.product);
          if (adminForAlert) {
            createNotification(global.io, {
              userId: adminForAlert._id,
              title: 'CẢNH BÁO TỒN KHO ⚠️',
              message: `Sản phẩm "${productForAlert?.name}" (${item.color}/${item.size}) sắp hết hàng. Còn lại: ${currentInv.stock} cái!`,
              type: 'SYSTEM',
              link: `/admin/products`,
              relatedId: productForAlert?._id
            });
          }
        }
      }
    });

    const customer = await User.findById(userId);
    // Thông báo cho khách
    createNotification(global.io, {
      userId: userId,
      title: 'Đặt hàng thành công 🛒',
      message: `Đơn hàng #${order._id.toString().slice(-6)} của bạn đã được hệ thống tiếp nhận.`,
      type: 'ORDER',
      link: `/orders/${order._id}`,
      relatedId: order._id
    });

    // Thông báo cho admin
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      createNotification(global.io, {
        userId: admin._id,
        title: 'CÓ ĐƠN HÀNG MỚI! 🛍️',
        message: `Khách ${customer.fullName} vừa đặt đơn trị giá ${totalAmount.toLocaleString()}đ`,
        type: 'ORDER',
        link: `/admin/orders/${order._id}`,
        relatedId: order._id
      });
    }

    const populatedOrder = await Order.findById(order._id).populate('items.product', 'name images');

    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      data: populatedOrder,
    });

  } catch (error) {
    // Nếu có lỗi, hủy toàn bộ thay đổi
    await session.abortTransaction();
    session.endSession();

    console.error('Lỗi tạo đơn hàng:', error.message);

    let status = 500;
    let message = 'Lỗi server khi tạo đơn hàng';

    if (error.message.startsWith('INSUFFICIENT_STOCK')) {
      const [_, name, variant, stock] = error.message.split('|');
      status = 400;
      message = `Sản phẩm "${name}" (${variant}) không đủ hàng. Còn lại: ${stock}`;
    } else if (error.message === 'CART_EMPTY') {
      status = 400;
      message = 'Giỏ hàng của bạn đang trống';
    } else if (error.message.startsWith('COUPON')) {
      status = 400;
      message = 'Mã giảm giá không hợp lệ hoặc đã hết lượt dùng';
    } else if (error.message.startsWith('MIN_ORDER_VALUE')) {
      const [_, val] = error.message.split('|');
      status = 400;
      message = `Đơn hàng chưa đạt giá trị tối thiểu ${Number(val).toLocaleString()}đ để dùng mã này`;
    } else if (error.message === 'MISSING_SHIPPING_INFO') {
      status = 400;
      message = 'Thiếu thông tin giao hàng';
    }

    return res.status(status).json({ success: false, message });
  }
};

/**
 * Lấy danh sách đơn hàng cá nhân
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id, isDeleted: false })
      .populate('items.product', 'name images price')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách đơn hàng' });
  }
};

/**
 * Lấy chi tiết đơn hàng
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('user', 'fullName email phone')
      .populate('items.product', 'name images price description');

    if (!order) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Hủy đơn hàng (Hoàn kho Inventory + Bắn thông báo)
 */
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('user', 'fullName');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Chỉ có thể hủy đơn hàng khi shop chưa xác nhận đơn.' 
      });
    }

    const inventoryOps = order.items.map((item) => ({
      updateOne: {
        filter: { variant: item.variant },
        update: { $inc: { stock: item.quantity, stockCount: -item.quantity } },
      },
    }));
    await Inventory.bulkWrite(inventoryOps);

    order.status = 'Cancelled';
    await order.save();
    
    await createNotification(global.io, {
      userId: order.user._id,
      title: 'Đơn hàng đã hủy thành công ❌',
      message: `Đơn hàng #${order._id.toString().slice(-6)} của bạn đã được hủy. Tiền (nếu có) sẽ được xử lý theo chính sách của shop.`,
      type: 'ORDER',
      link: `/orders/${order._id}`,
      relatedId: order._id
    });

    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      await createNotification(global.io, {
        userId: admin._id,
        title: 'KHÁCH HÀNG HỦY ĐƠN ⚠️',
        message: `Khách ${order.user.fullName} vừa hủy đơn #${order._id.toString().slice(-6)}. Kho đã tự động hoàn hàng.`,
        type: 'ORDER',
        link: `/admin/orders/${order._id}`,
        relatedId: order._id
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Hủy đơn hàng thành công, kho đã được hoàn lại và thông báo đã gửi.' 
    });

  } catch (error) {
    console.error('Lỗi khi hủy đơn:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi server khi hủy đơn' });
  }
};

/**
 * Lấy tất cả đơn hàng (Admin)
 */
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({ isDeleted: false })
      .populate('user', 'fullName email phone')
      .populate('items.product', 'name images price')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Cập nhật trạng thái đơn hàng (Admin)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { orderId } = req.params;

    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });

    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

    const businessContent = {
      'Confirmed': {
        title: 'Đơn hàng đã được xác nhận',
        message: `Đơn hàng #${order._id.toString().slice(-6)} đã được xác nhận. Chúng tôi đang chuẩn bị sản phẩm để giao đến bạn.`
      },
      'Shipped': {
        title: 'Đơn hàng đang được giao',
        message: `Kiện hàng #${order._id.toString().slice(-6)} đã được bàn giao cho đơn vị vận chuyển và đang trên đường đến bạn.`
      },
      'Delivered': {
        title: 'Giao hàng thành công',
        message: `Đơn hàng #${order._id.toString().slice(-6)} đã được giao thành công. Cảm ơn bạn đã tin tưởng FashionShop!`
      },
      'Cancelled': {
        title: 'Thông báo hủy đơn hàng',
        message: `Đơn hàng #${order._id.toString().slice(-6)} đã được hủy thành công theo yêu cầu.`
      }
    };

    const content = businessContent[status] || { title: 'Cập nhật đơn hàng', message: `Trạng thái mới: ${status}` };

    await createNotification(global.io, {
      userId: order.user,
      title: content.title,
      message: content.message,
      type: 'ORDER',
      link: `/orders/${order._id}`,
      relatedId: order._id
    });

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Thống kê Dashboard
 */
const getDashboardStats = async (req, res) => {
  try {
    const revenueResult = await Order.aggregate([
      { $match: { status: 'Delivered', isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const totalOrders = await Order.countDocuments({ isDeleted: false });
    const totalUsers = await User.countDocuments({ role: 'user', isDeleted: false });
    
    const lowStockProducts = await Inventory.countDocuments({ stock: { $lt: 10 } });

    const ordersByStatus = await Order.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statsObj = {};
    ordersByStatus.forEach(item => statsObj[`${item._id.toLowerCase()}Orders`] = item.count);

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        lowStockProducts,
        totalUsers,
        pendingOrders: statsObj.pendingOrders || 0,
        confirmedOrders: statsObj.confirmedOrders || 0,
        deliveredOrders: statsObj.deliveredOrders || 0,
        cancelledOrders: statsObj.cancelledOrders || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getDashboardStats,
};