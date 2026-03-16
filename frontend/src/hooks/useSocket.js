import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

/**
 * Hook useSocket - Sử dụng SocketContext dễ dàng hơn
 * Thay vì useContext(SocketContext), chỉ cần useSocket()
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket phải được sử dụng bên trong SocketProvider');
  }
  return context;
};
