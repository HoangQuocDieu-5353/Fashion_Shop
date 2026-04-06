import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, Loader2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

// 🚀 QUAN TRỌNG: Phải có chữ "export const" ở đây
export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Vui lòng nhập địa chỉ Email.');

    try {
      setLoading(true);
      const res = await axiosInstance.post('/auth/forgot-password', { email });
      if (res.data.success) {
        toast.success('Liên kết khôi phục đã được gửi. Check Mailtrap nhé!', { duration: 6000 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi yêu cầu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-[400px] w-full space-y-12 text-center">
        <h1 className="text-[24px] font-bold uppercase tracking-[6px]">Quên mật khẩu</h1>
        <form onSubmit={handleSubmit} className="space-y-8 text-left">
          <div className="space-y-2 group">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">Địa chỉ Email</label>
            <div className="relative border-b border-gray-200 group-focus-within:border-black transition-all">
              <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-8 py-3 bg-transparent outline-none text-[13px]"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-black text-white py-4 text-[11px] font-bold uppercase tracking-[3px] flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={16} /> : <><Send size={14} /> Gửi yêu cầu</>}
          </button>
        </form>
        <Link to="/login" className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-center gap-2">
          <ArrowLeft size={14} /> Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
};