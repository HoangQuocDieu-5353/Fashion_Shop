import { createContext, useEffect, useState, useCallback, useContext } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { AuthContext } from './AuthContext';

/**
 * SocketContext - Trạm thu phát tín hiệu Real-time
 */
export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, user } = useContext(AuthContext);

  useEffect(() => {
    // 1. Nếu chưa đăng nhập thì ngắt kết nối ngay
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // 2. Khởi tạo kết nối với Token xác thực
    const token = localStorage.getItem('token');
    const socketInstance = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to Socket Server');
      setIsConnected(true);
    });

    // ============================================================
    // 🚀 LẮNG NGHE THÔNG BÁO TỔNG HỢP (MODEL 11)
    // ============================================================
    socketInstance.on('new_notification', (notification) => {
      console.log('🔔 Thông báo mới:', notification);

      const typeConfig = {
        ORDER: { color: 'border-black', icon: '🛍️' },
        PROMOTION: { color: 'border-red-500', icon: '🎁' },
        SYSTEM: { color: 'border-amber-500', icon: '⚠️' },
      };

      const config = typeConfig[notification.type] || { color: 'border-zinc-300', icon: '🔔' };

      // Toast giao diện Business (Chữ nhỏ, thanh thoát)
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-[24px] pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-8 ${config.color} overflow-hidden`}>
          <div className="flex-1 w-0 p-5">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5 text-2xl">{config.icon}</div>
              <div className="ml-4 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[3px] text-zinc-400 mb-1">{notification.type} Alert</p>
                <p className="text-sm font-black text-black uppercase tracking-tight">{notification.title}</p>
                <p className="mt-1 text-[11px] font-medium text-zinc-500 leading-relaxed">{notification.message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-zinc-100">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      ), { duration: 5000 });
    });

    socketInstance.on('disconnect', () => setIsConnected(false));
    
    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket Error:', error.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user]);

  const emit = useCallback((event, data) => {
    if (socket?.connected) socket.emit(event, data);
  }, [socket]);

  // Truyền toàn bộ các biến cần thiết vào value
  const value = { socket, isConnected, emit };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};


export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context; // Trả về { socket, isConnected, emit }
};