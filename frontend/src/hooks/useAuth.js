import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook useAuth - Sử dụng AuthContext dễ dàng hơn
 * Thay vì useContext(AuthContext), chỉ cần useAuth()
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};
