const Notification = require('../models/Notification');

const createNotification = async (io, data) => {
  try {
    // 1. Lưu vào Database trước (Bắt buộc)
    const newNotif = await Notification.create({
      user: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'ORDER',
      link: data.link,
      relatedId: data.relatedId
    });

    // 2. Bắn tin qua Socket.io (Nếu khách đang online thì nhận luôn)
    if (io) {
      // Gửi riêng cho user đó (room dựa trên userId)
      io.to(data.userId.toString()).emit('new_notification', newNotif);
    }
    
    return newNotif;
  } catch (error) {
    console.error("Lỗi tạo thông báo:", error);
  }
};

module.exports = { createNotification };