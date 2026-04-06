import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { ShieldCheck, XCircle, Loader2, ArrowRight } from 'lucide-react';

export const VerifyEmailPage = () => {
  const { token } = useParams(); // Lấy token từ link: /verify-email/:token
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const triggerVerify = async () => {
      try {
        // 🚀 GỌI API XÁC THỰC SANG BACKEND (PORT 5000)
        const response = await axiosInstance.get(`/auth/verify-email/${token}`);
        
        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message);
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Link xác thực không hợp lệ hoặc đã hết hạn.');
      }
    };

    if (token) {
      // Đợi 1.5s cho nó có cảm giác đang xử lý chuyên nghiệp :))
      const timer = setTimeout(() => triggerVerify(), 1500);
      return () => clearTimeout(timer);
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-[450px] w-full text-center space-y-8">
        
        {/* TRẠNG THÁI ĐANG XỬ LÝ */}
        {status === 'loading' && (
          <div className="space-y-6 animate-pulse">
            <div className="flex justify-center">
              <Loader2 className="animate-spin text-zinc-200" size={60} strokeWidth={1} />
            </div>
            <h2 className="text-[13px] font-black uppercase tracking-[5px] text-zinc-400">
              Đang xác thực tài khoản...
            </h2>
          </div>
        )}

        {/* TRẠNG THÁI THÀNH CÔNG */}
        {status === 'success' && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex justify-center">
              <div className="bg-black p-6 rounded-full text-white shadow-2xl">
                <ShieldCheck size={40} strokeWidth={1.5} />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black uppercase tracking-[4px]">Xác thực thành công</h2>
              <p className="text-[13px] text-gray-500 uppercase tracking-wider leading-relaxed">
                Tài khoản của bạn đã được kích hoạt.<br />Chào mừng bạn đến với Fashion Shop!
              </p>
            </div>
            <Link to="/login" className="inline-block bg-black text-white px-12 py-4 text-[11px] font-bold uppercase tracking-[3px] hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
              Đăng nhập ngay <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* TRẠNG THÁI LỖI */}
        {status === 'error' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-center text-red-500">
              <XCircle size={80} strokeWidth={1} />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black uppercase tracking-[4px]">Lỗi xác thực</h2>
              <p className="text-[13px] text-gray-500 uppercase tracking-wider">
                {message}
              </p>
            </div>
            <Link to="/register" className="inline-block border-b-2 border-black pb-1 text-[11px] font-black uppercase tracking-[2px] hover:text-gray-400 hover:border-gray-400 transition-all">
              Thử đăng ký lại tài khoản khác
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};