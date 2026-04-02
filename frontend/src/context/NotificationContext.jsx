import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';

// Khởi tạo Context với giá trị mặc định là một object chứa các mảng rỗng
// Việc này giúp tránh lỗi "Cannot destructure..." nếu Provider gặp sự cố
const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  fetchNotifications: () => {}
});

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // 🚀 ĐÃ FIX: Lấy socket chuẩn từ SocketContext
  const socketData = useSocket();
  const socket = socketData?.socket; 

  const fetchNotifications = async () => {
    try {
      const { data } = await axiosInstance.get('/notifications');
      if (data?.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.log("Hệ thống thông báo đang khởi tạo...");
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewNotif = (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.success(newNotif.title, { 
          icon: '🔔',
          style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px' }
        });
      };

      socket.on('new_notification', handleNewNotif);
      return () => socket.off('new_notification', handleNewNotif);
    }
  }, [socket]);

  const markAsRead = async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  // Nếu gọi ngoài Provider, trả về object mặc định thay vì báo lỗi undefined
  if (!context || Object.keys(context).length === 0) {
    return {
      notifications: [],
      unreadCount: 0,
      markAsRead: () => {},
      fetchNotifications: () => {}
    };
  }
  return context;
};