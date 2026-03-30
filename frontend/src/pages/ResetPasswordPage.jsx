import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

export const ResetPasswordPage = () => {
  const { token } = useParams(); // Lấy token từ URL (cái chuỗi gửi qua mail)
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});

  // Kiểm tra định dạng mật khẩu mạnh thời gian thực
  const validate = (name, value) => {
    if (name === 'password') {
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;
      return !regex.test(value) ? 'Mật khẩu cần 8-32 ký tự, đủ hoa, thường, số, ký tự đặc biệt.' : '';
    }
    if (name === 'confirmPassword') {
      return value !== formData.password ? 'Xác nhận mật khẩu không trùng khớp.' : '';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (errors.password || errors.confirmPassword || !formData.password) {
      return toast.error('Vui lòng kiểm tra lại các yêu cầu về mật khẩu.');
    }

    try {
      setLoading(true);
      // Gửi mật khẩu mới kèm token lên Backend
      const res = await axiosInstance.put(`/auth/reset-password/${token}`, { 
        password: formData.password 
      });

      if (res.data.success) {
        toast.success('Mật khẩu của ông giáo đã được cập nhật!');
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Liên kết hết hạn hoặc không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-[400px] w-full space-y-12">
        <div className="text-center space-y-2">
          <h1 className="text-[24px] font-bold uppercase tracking-[6px] text-black">Mật khẩu mới</h1>
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest">
            Thiết lập lại quyền truy cập cho tài khoản của bạn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            {/* New Password */}
            <div className="space-y-2 group">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">Mật khẩu mới</label>
              <div className={`relative border-b ${errors.password ? 'border-red-500' : 'border-gray-200 group-focus-within:border-black'} transition-all`}>
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder="••••••••"
                  className="w-full pl-8 py-3 bg-transparent outline-none text-[13px]" 
                />
              </div>
              {errors.password && <p className="text-[9px] text-red-500 font-bold uppercase pt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2 group">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">Xác nhận lại</label>
              <div className={`relative border-b ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200 group-focus-within:border-black'} transition-all`}>
                <ShieldCheck className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  placeholder="••••••••"
                  className="w-full pl-8 py-3 bg-transparent outline-none text-[13px]" 
                />
              </div>
              {errors.confirmPassword && <p className="text-[9px] text-red-500 font-bold uppercase pt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-black text-white py-4 text-[11px] font-bold uppercase tracking-[3px] flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <><CheckCircle2 size={14} /> Cập nhật mật khẩu</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};