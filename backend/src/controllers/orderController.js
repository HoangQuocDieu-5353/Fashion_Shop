const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { notifyAdminNewOrder, notifyCustomerOrderUpdate } = require('../utils/socketHandler');

/**
 * Tạo đơn hàng từ giỏ hàng
 * POST /api/orders/create
 * @access Private
 */
const createOrder = async (req, res) => {
  try {
    const { shippingAddress, phone, paymentMethod } = req.body;
    const userId = req.user._id;

    // Kiểm tra dữ liệu đầu vào
    if (!shippingAddress || !phone || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ giao hàng, số điện thoại và phương thức thanh toán',
        data: null,
      });
    }

    // Kiểm tra paymentMethod hợp lệ
    const validPaymentMethods = ['COD', 'Card'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Phương thức thanh toán không hợp lệ. Các giá trị hợp lệ: ${validPaymentMethods.join(', ')}`,
        data: null,
      });
    }

    // Lấy giỏ hàng của người dùng
    const cart = await Cart.findOne({ user: userId }).populate(
      'items.product',
      'stock price name'
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng trống, không thể tạo đơn hàng',
        data: null,
      });
    }

    // Kiểm tra tồn kho và chuẩn bị dữ liệu order items
    const orderItems = [];
    let totalAmount = 0;

    for (const cartItem of cart.items) {
      const product = cartItem.product;

      // Kiểm tra sản phẩm tồn tại
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Một sản phẩm trong giỏ hàng không tồn tại',
          data: null,
        });
      }

      // Kiểm tra tồn kho
      if (cartItem.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${product.name}" không đủ hàng (yêu cầu: ${cartItem.quantity}, còn: ${product.stock})`,
          data: null,
        });
      }

      // Thêm vào order items với giá tại thời điểm mua
      orderItems.push({
        product: product._id,
        quantity: cartItem.quantity,
        size: cartItem.size,
        color: cartItem.color,
        price: product.price, // Lưu giá tại thời điểm mua
      });

      // Tính tổng tiền
      totalAmount += product.price * cartItem.quantity;
    }

    // Tạo đơn hàng mới
    const order = new Order({
      user: userId,
      items: orderItems,
      totalAmount,
      shippingAddress,
      phone,
      paymentMethod,
      status: 'Pending',
    });

    // Lưu đơn hàng vào database
    await order.save();

    // Trừ stock từng sản phẩm trong Product model
    // Sử dụng bulkWrite để update tất cả cùng lúc (atomic operation)
    // Tránh race condition nếu một update thất bại giữa quá trình
    const bulkOps = orderItems.map((orderItem) => ({
      updateOne: {
        filter: { _id: orderItem.product },
        update: { $inc: { stock: -orderItem.quantity } },
      },
    }));

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
    }

    // Xóa sạch giỏ hàng
    cart.items = [];
    await cart.save();

    // Populate thông tin sản phẩm để trả về
    const populatedOrder = await Order.findById(order._id).populate(
      'items.product',
      'name mainImage'
    );

    // ================================================================
    // 🔔 SOCKET.IO - THÔNG BÁO ĐƠN HÀNG MỚI TỚI ADMIN
    // ================================================================
    // Lấy thông tin customer để gửi trong thông báo
    const customer = await User.findById(userId);

    if (global.io) {
      notifyAdminNewOrder(global.io, {
        _id: order._id,
        customerName: customer.fullName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        totalAmount: order.totalAmount,
        itemCount: order.items.length,
        paymentMethod: order.paymentMethod,
        status: order.status,
        createdAt: order.createdAt,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thành công',
      data: populatedOrder,
    });
  } catch (error) {
    console.error('Lỗi tạo đơn hàng:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đơn hàng',
      data: null,
    });
  }
};

/**
 * Lấy danh sách đơn hàng của người dùng đang đăng nhập
 * GET /api/orders/my-orders
 * @access Private
 */
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    // Lấy tất cả đơn hàng của user (không lấy đơn đã xóa mềm)
    const orders = await Order.find({ user: userId, isDeleted: false })
      .populate('items.product', 'name mainImage price')
      .sort({ createdAt: -1 }); // Sắp xếp mới nhất trước

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: orders,
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách đơn hàng:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn hàng',
      data: null,
    });
  }
};

/**
 * Lấy chi tiết một đơn hàng cụ thể
 * GET /api/orders/:orderId
 * @access Private
 */
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    // Tìm đơn hàng
    const order = await Order.findById(orderId)
      .populate('user', 'fullName email phone')
      .populate('items.product', 'name mainImage price description');

    // Kiểm tra đơn hàng tồn tại
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Đơn hàng không tồn tại',
        data: null,
      });
    }

    // Kiểm tra quyền truy cập (chỉ user sở hữu đơn mới được xem)
    if (order.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập đơn hàng này',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết đơn hàng thành công',
      data: order,
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết đơn hàng:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết đơn hàng',
      data: null,
    });
  }
};

/**
 * Hủy đơn hàng (chỉ khi status là 'Pending')
 * PATCH /api/orders/cancel/:orderId
 * @access Private
 */
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    // Tìm đơn hàng
    const order = await Order.findById(orderId).populate(
      'items.product',
      'stock'
    );

    // Kiểm tra đơn hàng tồn tại
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Đơn hàng không tồn tại',
        data: null,
      });
    }

    // Kiểm tra quyền truy cập
    // order.user có thể là ObjectId hoặc object (nếu populate), luôn convert sang string
    const orderUserId = order.user._id ? order.user._id.toString() : order.user.toString();
    if (orderUserId !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy đơn hàng này',
        data: null,
      });
    }

    // Kiểm tra trạng thái (chỉ có thể hủy nếu trạng thái là 'Pending')
    if (order.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy đơn hàng có trạng thái "${order.status}"`,
        data: null,
      });
    }

    // Cộng lại stock cho tất cả sản phẩm trong đơn
    for (const orderItem of order.items) {
      await Product.findByIdAndUpdate(
        orderItem.product._id,
        {
          $inc: { stock: orderItem.quantity }, // Cộng stock lại
        },
        { new: true }
      );
    }

    // Cập nhật trạng thái đơn thành 'Cancelled'
    order.status = 'Cancelled';
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Hủy đơn hàng thành công',
      data: order,
    });
  } catch (error) {
    console.error('Lỗi hủy đơn hàng:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy đơn hàng',
      data: null,
    });
  }
};

/**
 * Lấy tất cả đơn hàng trong hệ thống (Admin only)
 * GET /api/orders/admin/all-orders
 * @access Private/Admin
 */
const getAllOrders = async (req, res) => {
  try {
    // Lấy tất cả đơn hàng (không lấy đơn đã xóa mềm)
    // Populate thông tin user và sản phẩm
    const orders = await Order.find({ isDeleted: false })
      .populate('user', 'fullName email phone')
      .populate('items.product', 'name mainImage price')
      .sort({ createdAt: -1 }); // Sắp xếp mới nhất trước

    return res.status(200).json({
      success: true,
      message: 'Lấy tất cả đơn hàng thành công',
      data: orders,
    });
  } catch (error) {
    console.error('Lỗi lấy tất cả đơn hàng:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy tất cả đơn hàng',
      data: null,
    });
  }
};

/**
 * Cập nhật trạng thái đơn hàng (Admin only)
 * PATCH /api/orders/admin/update-status/:orderId
 * @access Private/Admin
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái đơn hàng',
        data: null,
      });
    }

    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['Pending', 'Confirmed', 'Shipping', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Các giá trị hợp lệ: ${validStatuses.join(', ')}`,
        data: null,
      });
    }

    // Tìm đơn hàng
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Đơn hàng không tồn tại',
        data: null,
      });
    }

    // Cập nhật trạng thái
    order.status = status;
    await order.save();

    // Populate thông tin đầy đủ để trả về
    const updatedOrder = await Order.findById(orderId)
      .populate('user', 'fullName email phone')
      .populate('items.product', 'name mainImage price');

    // ================================================================
    // 🔔 SOCKET.IO - THÔNG BÁO CẬP NHẬT TRẠNG THÁI TỚI KHÁCH HÀNG
    // ================================================================
    if (global.io) {
      notifyCustomerOrderUpdate(global.io, order.user.toString(), {
        _id: order._id,
        status: order.status,
        totalAmount: order.totalAmount,
        updatedAt: order.updatedAt,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái đơn hàng:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái đơn hàng',
      data: null,
    });
  }
};

/**
 * Lấy thống kê dashboard (Admin only)
 * GET /api/orders/admin/dashboard-stats
 * @access Private/Admin
 */
const getDashboardStats = async (req, res) => {
  try {
    // 1. Tính tổng doanh thu (Chỉ tính đơn đã Delivered)
    const revenueResult = await Order.aggregate([
      { $match: { status: 'Delivered', isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // 2. Đếm các đầu số tổng quát
    const totalOrders = await Order.countDocuments({ isDeleted: false });
    const totalProducts = await Product.countDocuments({ isDeleted: false });
    const totalUsers = await User.countDocuments({ isDeleted: false });
    // Đếm hàng sắp hết (ví dụ stock < 10) để hiện lên Card orange
    const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10 }, isDeleted: false });

    // 3. Đếm chi tiết từng trạng thái (Để khớp với FE)
    const ordersByStatus = await Order.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Convert mảng thành Object phẳng cho FE dễ đọc
    const statsObj = {};
    ordersByStatus.forEach((item) => {
      // Ví dụ: statsObj['pendingOrders'] = 5
      statsObj[`${item._id.toLowerCase()}Orders`] = item.count;
    });

    // 4. LẤY DỮ LIỆU BIỂU ĐỒ (7 ngày gần nhất) - CỰC KỲ QUAN TRỌNG 🚀
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRevenue = await Order.aggregate([
      { 
        $match: { 
          status: 'Delivered', 
          isDeleted: false,
          createdAt: { $gte: sevenDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%d/%m", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id": 1 } },
      { $project: { date: "$_id", revenue: 1, _id: 0 } }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalProducts,
        lowStockProducts,
        // Đưa các trạng thái ra ngoài để FE gọi trực tiếp stats.pendingOrders
        pendingOrders: statsObj.pendingOrders || 0,
        confirmedOrders: statsObj.confirmedOrders || 0,
        deliveredOrders: statsObj.deliveredOrders || 0,
        cancelledOrders: statsObj.cancelledOrders || 0,
        dailyRevenue,
        totalUsers, // Trả về mảng để vẽ biểu đồ AreaChart
        revenueGrowth: 10.5 // Tạm thời để số tĩnh hoặc tính % nếu muốn
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
