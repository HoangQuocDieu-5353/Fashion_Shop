import { createContext, useEffect, useState, useCallback, useContext } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { AuthContext } from './AuthContext';

/**
 * SocketContext - Context để quản lý kết nối Socket.io
 * Lắng nghe các sự kiện real-time từ server:
 * - newOrderAdmin: Thông báo khi có đơn hàng mới (cho Admin)
 * - orderStatusUpdate: Thông báo cập nhật trạng thái đơn (cho Customer)
 */
export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineAdmins, setOnlineAdmins] = useState(0);
  const { isAuthenticated, user } = useContext(AuthContext);

  /**
   * Khởi tạo kết nối Socket.io
   * Gửi token trong phần auth của socket handshake
   */
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      // Khởi tạo socket connection với JWT token
      const socketInstance = io(import.meta.env.VITE_SOCKET_URL, {
        auth: {
          token: token, // Gửi token để server xác thực
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      /**
       * Lắng nghe sự kiện 'connectionConfirmed'
       * Server gửi thông báo khi socket đã kết nối thành công
       */
      socketInstance.on('connectionConfirmed', (data) => {
        console.log('✅ Socket kết nối thành công:', data);
        setIsConnected(true);
      });

      /**
       * Lắng nghe sự kiện 'newOrderAdmin'
       * Thông báo khi có đơn hàng mới (chỉ hiển thị cho Admin)
       */
      socketInstance.on('newOrderAdmin', (notification) => {
        if (user?.role === 'admin') {
          console.log('📧 Đơn hàng mới:', notification);
          toast.custom((t) => (
            <div className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-green-500">
              <h3 className="font-bold text-lg text-gray-800">{notification.title}</h3>
              <p className="text-sm text-gray-600">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-2">
                💰 {notification.order?.totalAmount.toLocaleString('vi-VN')} VNĐ
              </p>
            </div>
          ));
        }
      });

      /**
       * Lắng nghe sự kiện 'orderStatusUpdate'
       * Thông báo cập nhật trạng thái đơn hàng (hiển thị cho Customer)
       */
      socketInstance.on('orderStatusUpdate', (notification) => {
        console.log('📦 Cập nhật trạng thái đơn:', notification);
        toast.custom((t) => (
          <div className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-blue-500">
            <h3 className="font-bold text-lg text-gray-800">{notification.title}</h3>
            <p className="text-sm text-gray-600">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-2">
              Trạng thái: {notification.order?.status}
            </p>
          </div>
        ));
      });

      /**
       * Lắng nghe sự kiện 'disconnect'
       * Hiển thị thông báo khi mất kết nối
       */
      socketInstance.on('disconnect', () => {
        console.log('❌ Socket đã ngắt kết nối');
        setIsConnected(false);
      });

      /**
       * Lắng nghe sự kiện 'connect_error'
       * Xử lý lỗi kết nối
       */
      socketInstance.on('connect_error', (error) => {
        console.error('❌ Lỗi kết nối socket:', error.message);
        toast.error('Mất kết nối. Đang thử kết nối lại...');
      });

      /**
       * Lắng nghe sự kiện 'reconnect'
       * Thông báo khi kết nối lại thành công
       */
      socketInstance.on('reconnect', () => {
        console.log('✅ Đã kết nối lại thành công');
        setIsConnected(true);
        toast.success('Đã kết nối lại');
      });

      setSocket(socketInstance);

      // Cleanup khi component unmount
      return () => {
        socketInstance.disconnect();
      };
    } catch (error) {
      console.error('Lỗi khởi tạo socket:', error);
    }
  }, [isAuthenticated, user]);

  /**
   * Hàm phát sự kiện emit tới server (nếu cần)
   */
  const emit = useCallback(
    (event, data) => {
      if (socket && socket.connected) {
        socket.emit(event, data);
      }
    },
    [socket]
  );

  /**
   * Hàm để test kết nối socket
   */
  const testConnection = useCallback(() => {
    if (socket && socket.connected) {
      socket.emit('ping');
      socket.on('pong', (data) => {
        console.log('🎯 Socket đang hoạt động:', data);
        toast.success('Socket đang hoạt động bình thường');
      });
    } else {
      toast.error('Socket chưa kết nối');
    }
  }, [socket]);

  const value = {
    socket,
    isConnected,
    onlineAdmins,
    emit,
    testConnection,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
