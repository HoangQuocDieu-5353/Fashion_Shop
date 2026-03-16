import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Tạo instance Axios với cấu hình baseURL từ environment
 * Tự động thêm token vào Authorization header cho mọi request
 * Xử lý lỗi 401 - tự động redirect về /login
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Cho phép gửi cookies
});

/**
 * Interceptor Request: Thêm token vào header
 * Lấy token từ localStorage và gắn vào Authorization: Bearer <token>
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor Response: Xử lý lỗi, nhưng không tự động redirect
 * Để cho component quản lý error theo context
 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Kiểm tra lỗi 401 - token không hợp lệ/hết hạn
    // Nhưng không tự động redirect (để component quản lý)
    if (error.response?.status === 401) {
      // Xóa token khỏi localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    // Xử lý các lỗi khác
    if (error.response?.status === 403) {
      toast.error('Bạn không có quyền truy cập');
    }

    if (error.response?.status === 500) {
      toast.error('Lỗi server. Vui lòng thử lại sau');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
