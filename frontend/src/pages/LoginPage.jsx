import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, isAuthenticated, user } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    if (isAuthenticated && isLoggingIn) {
      setIsLoggingIn(false);
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, isLoggingIn, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return toast.error('Vui lòng cung cấp đầy đủ thông tin đăng nhập.');
    }

    try {
      setIsLoggingIn(true);
      await login(formData.email, formData.password);
    } catch (error) {
      setIsLoggingIn(false);
      // Toast báo lỗi đã được handle trong AuthContext
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-[400px] w-full space-y-12">
        
        {/* HEADER SECTION */}
        <div className="text-center space-y-2">
          <h1 className="text-[28px] font-bold uppercase tracking-[6px] text-black">Đăng Nhập</h1>
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest">
            Chào mừng bạn trở lại với Fashion Shop
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2 group">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] group-focus-within:text-black transition-colors">
                Địa chỉ Email
              </label>
              <div className="relative border-b border-gray-200 group-focus-within:border-black transition-all">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full pl-8 py-3 bg-transparent outline-none text-[13px] placeholder:text-gray-200"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2 group">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] group-focus-within:text-black transition-colors">
                  Mật khẩu
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter hover:text-black transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative border-b border-gray-200 group-focus-within:border-black transition-all">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-8 py-3 bg-transparent outline-none text-[13px] placeholder:text-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 text-[11px] font-bold uppercase tracking-[3px] flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>Xác nhận đăng nhập <ArrowRight size={14} /></>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="pt-6 border-t border-gray-100 text-center space-y-4">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-black font-bold hover:underline underline-offset-4">
              Đăng ký ngay
            </Link>
          </p>
          
          <div className="bg-gray-50 p-4 border border-gray-100 rounded-sm">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight text-left mb-2"></p>
            
          </div>
        </div>
      </div>
    </div>
  );
};