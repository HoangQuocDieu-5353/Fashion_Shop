import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../hooks/useAuth';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated } = useAuth();

  // Hàm lấy số lượng từ Server
  const fetchCartCount = async () => {
    if (!isAuthenticated) {
      setCartCount(0);
      return;
    }
    try {
      const res = await axiosInstance.get('/carts');
      if (res.data.success) {
        setCartCount(res.data.data.totalQuantity || 0);
      }
    } catch (error) {
      console.error("Lỗi đồng bộ giỏ hàng");
      setCartCount(0);
    }
  };

  // Tự động chạy khi user đăng nhập/đăng xuất
  useEffect(() => {
    fetchCartCount();
  }, [isAuthenticated]);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, fetchCartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);