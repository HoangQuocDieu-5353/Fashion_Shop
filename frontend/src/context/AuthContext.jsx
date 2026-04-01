import { createContext, useState, useCallback, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

/**
 * AuthContext - Context để quản lý trạng thái xác thực
 * Lưu trữ: user, isAuthenticated, loading
 * Cung cấp: login(), register(), logout(), getMe()
 */
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * Lấy thông tin user hiện tại
   * Gọi khi app khởi động để kiểm tra user đã đăng nhập hay chưa
   */
  const getMe = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/users/me');
      if (response.data.success) {
        setUser(response.data.data);
        setIsAuthenticated(true);
        return response.data.data;
      }
    } catch (error) {
      console.error('Lỗi lấy thông tin user:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Đăng nhập
   * @param {string} email - Email người dùng
   * @param {string} password - Mật khẩu người dùng
   */
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        const { token, user: userData } = response.data.data;

        // Lưu token vào localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        // Cập nhật state
        setUser(userData);
        setIsAuthenticated(true);

        toast.success('Đăng nhập thành công');
        return response.data.data;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại';
      console.error('Lỗi đăng nhập:', error);
      toast.error(message);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Đăng ký tài khoản mới
   * @param {object} userData - { fullName, email, password, phone }
   */
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/auth/register', userData);

      if (response.data.success) {
        const { token, user: newUser } = response.data.data;

        // Lưu token vào localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(newUser));

        // Cập nhật state
        setUser(newUser);
        setIsAuthenticated(true);

        toast.success('Đăng ký thành công');
        return response.data.data;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng ký thất bại';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Đăng xuất
   */
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Đã đăng xuất');
  }, []);

  /**
   * Cập nhật thông tin user
   */
  const updateProfile = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await axiosInstance.patch('/users/profile', data);

      if (response.data.success) {
        setUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        toast.success('Cập nhật thông tin thành công');
        return response.data.data;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Cập nhật thất bại';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Khởi tạo: Kiểm tra token trong localStorage
   * Nếu có token, gọi getMe() để lấy thông tin user từ server
   */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      // Gọi getMe() để refresh dữ liệu từ server
      // và đảm bảo role được cập nhật từ DB
      getMe();
    }
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateProfile,
    getMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
