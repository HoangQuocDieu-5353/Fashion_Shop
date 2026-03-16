const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Map lưu trữ mapping giữa userId và socketId
 * Cấu trúc: { userId: { socketId: socket } }
 * Cho phép một user có nhiều kết nối từ các thiết bị khác nhau
 */
const userSocketMap = {};

/**
 * Middleware xác thực Socket Connection
 * Kiểm tra JWT Token từ handshake query hoặc auth header
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    // Lấy token từ query hoặc auth header
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Token không được cung cấp'));
    }

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Lấy thông tin user từ database
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error('Người dùng không tồn tại'));
    }

    // Lưu thông tin user vào socket object
    socket.userId = user._id.toString();
    socket.userRole = user.role;
    socket.userName = user.fullName;

    next();
  } catch (error) {
    console.error('Lỗi xác thực socket:', error.message);
    next(new Error('Token không hợp lệ'));
  }
};

/**
 * Khởi tạo Socket.io events
 * @param {Server} io - Socket.io server instance
 */
const initializeSocket = (io) => {
  // Áp dụng middleware xác thực
  io.use(socketAuthMiddleware);

  // Lắng nghe sự kiện kết nối
  io.on('connection', (socket) => {
    console.log(`\n✅ Người dùng đã kết nối:`, {
      userId: socket.userId,
      socketId: socket.id,
      role: socket.userRole,
      name: socket.userName,
    });

    // ================================================================
    // 1. MAPPING USER-SOCKET
    // ================================================================
    // Tạo entry cho user nếu chưa có
    if (!userSocketMap[socket.userId]) {
      userSocketMap[socket.userId] = {};
    }

    // Lưu socketId của kết nối này
    userSocketMap[socket.userId][socket.id] = socket;

    // Nếu là admin, join vào room 'admin' để nhận thông báo admin
    if (socket.userRole === 'admin') {
      socket.join('admin');
      console.log(`📢 Admin ${socket.userName} đã join room admin`);
    }

    // User join vào room cá nhân để nhận thông báo riêng
    socket.join(socket.userId);
    console.log(`📌 User ${socket.userName} đã join room cá nhân (${socket.userId})`);

    // ================================================================
    // 2. SOCKET EVENTS
    // ================================================================

    /**
     * Sự kiện: Người dùng nhận thông báo đã kết nối
     * Frontend gửi sự kiện này để xác nhận kết nối đã sẵn sàng
     */
    socket.on('userConnected', () => {
      console.log(`🔔 User ${socket.userName} đã xác nhận kết nối`);
      socket.emit('connectionConfirmed', {
        success: true,
        message: 'Kết nối socket thành công',
        userId: socket.userId,
        socketId: socket.id,
      });
    });

    /**
     * Sự kiện: Ngắt kết nối
     * Xóa mapping khi user ngắt kết nối
     */
    socket.on('disconnect', () => {
      console.log(`\n❌ Người dùng đã ngắt kết nối:`, {
        userId: socket.userId,
        socketId: socket.id,
      });

      // Xóa socketId từ map
      if (userSocketMap[socket.userId]) {
        delete userSocketMap[socket.userId][socket.id];

        // Nếu user không còn kết nối nào, xóa entry
        if (Object.keys(userSocketMap[socket.userId]).length === 0) {
          delete userSocketMap[socket.userId];
        }
      }

      // Nếu là admin, rời khỏi room admin
      if (socket.userRole === 'admin') {
        socket.leave('admin');
        console.log(`📢 Admin ${socket.userName} đã rời room admin`);
      }
    });

    /**
     * Sự kiện: Test kết nối
     * Dùng để kiểm tra socket có hoạt động
     */
    socket.on('ping', () => {
      socket.emit('pong', {
        timestamp: new Date(),
        message: 'Socket đang hoạt động bình thường',
      });
    });
  });
};

/**
 * Hàm gửi thông báo đơn hàng mới tới tất cả Admin
 * @param {Server} io - Socket.io server instance
 * @param {Object} orderData - Dữ liệu đơn hàng
 */
const notifyAdminNewOrder = (io, orderData) => {
  const notification = {
    type: 'newOrder',
    title: 'Đơn hàng mới',
    message: `Có đơn hàng mới từ ${orderData.customerName}`,
    order: orderData,
    timestamp: new Date(),
  };

  // Emit tới room 'admin' - Tất cả admin sẽ nhận được
  io.to('admin').emit('newOrderAdmin', notification);

  console.log(`📧 Gửi thông báo đơn hàng mới tới admin:`, notification);
};

/**
 * Hàm gửi cập nhật trạng thái đơn hàng tới khách hàng
 * @param {Server} io - Socket.io server instance
 * @param {String} userId - ID của khách hàng
 * @param {Object} orderData - Dữ liệu đơn hàng
 */
const notifyCustomerOrderUpdate = (io, userId, orderData) => {
  const notification = {
    type: 'orderStatusUpdate',
    title: 'Cập nhật trạng thái đơn hàng',
    message: `Đơn hàng của bạn đã chuyển sang trạng thái: ${orderData.status}`,
    order: orderData,
    timestamp: new Date(),
  };

  // Emit tới room userId - Chỉ khách hàng đó sẽ nhận được
  io.to(userId).emit('orderStatusUpdate', notification);

  console.log(`📧 Gửi cập nhật trạng thái đơn hàng [${orderData.status}] tới customer ${userId}:`, notification);
};

/**
 * Hàm broadcast thông báo tới tất cả kết nối admin của một user
 * Dùng trong trường hợp user kiểm tra danh sách admin online
 * @param {Server} io - Socket.io server instance
 */
const getOnlineAdmins = (io) => {
  const adminSockets = io.sockets.adapter.rooms.get('admin');
  return adminSockets ? adminSockets.size : 0;
};

module.exports = {
  initializeSocket,
  notifyAdminNewOrder,
  notifyCustomerOrderUpdate,
  getOnlineAdmins,
  userSocketMap,
};
