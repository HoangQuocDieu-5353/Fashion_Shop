import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Phone, Lock, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading, isAuthenticated } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  // 🛡️ Logic kiểm tra định dạng thời gian thực
  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'fullName':
        if (value.length < 2) error = 'Họ tên phải từ 2 ký tự trở lên.';
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) error = 'Định dạng email không hợp lệ.';
        break;
      case 'phone':
        const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
        if (!phoneRegex.test(value)) error = 'Số điện thoại Việt Nam phải đủ 10 chữ số.';
        break;
      case 'password':
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;
        if (!passwordRegex.test(value)) error = 'Mật khẩu cần 8-32 ký tự, đủ chữ hoa, thường, số và ký tự đặc biệt.';
        break;
      case 'confirmPassword':
        if (value !== formData.password) error = 'Xác nhận mật khẩu không trùng khớp.';
        break;
      default:
        break;
    }
    return error;
  };

  useEffect(() => {
    if (isAuthenticated && isRegistering) {
      setIsRegistering(false);
      navigate('/');
    }
  }, [isAuthenticated, isRegistering, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Cập nhật lỗi ngay khi đang gõ
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra lần cuối trước khi gửi
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return toast.error('Vui lòng hoàn thiện thông tin đúng định dạng.');
    }

    try {
      setIsRegistering(true);
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });
    } catch (error) {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-20">
      <div className="max-w-[450px] w-full space-y-12">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="text-[24px] font-bold uppercase tracking-[6px] text-black">Khởi tạo tài khoản</h1>
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest">
            Gia nhập cộng đồng thời trang HUTECH 2022
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 gap-y-6">
            
            {/* Input Component Helper */}
            {[
              { label: 'Họ và tên', name: 'fullName', type: 'text', icon: User, placeholder: 'Nguyễn Văn A' },
              { label: 'Địa chỉ Email', name: 'email', type: 'email', icon: Mail, placeholder: 'name@example.com' },
              { label: 'Số điện thoại', name: 'phone', type: 'tel', icon: Phone, placeholder: '09xxxxxxxx' },
              { label: 'Mật khẩu', name: 'password', type: 'password', icon: Lock, placeholder: '••••••••' },
              { label: 'Xác nhận mật khẩu', name: 'confirmPassword', type: 'password', icon: ShieldCheck, placeholder: '••••••••' },
            ].map((field) => (
              <div key={field.name} className="space-y-1 group">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] group-focus-within:text-black transition-colors">
                  {field.label}
                </label>
                <div className={`relative border-b ${errors[field.name] ? 'border-red-500' : 'border-gray-200 group-focus-within:border-black'} transition-all`}>
                  <field.icon className={`absolute left-0 top-1/2 -translate-y-1/2 ${errors[field.name] ? 'text-red-500' : 'text-gray-300'}`} size={16} />
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="w-full pl-8 py-3 bg-transparent outline-none text-[13px] placeholder:text-gray-200"
                  />
                </div>
                {errors[field.name] && (
                  <p className="text-[9px] font-bold text-red-500 uppercase tracking-tight pt-1 animate-in fade-in slide-in-from-top-1">
                    {errors[field.name]}
                  </p>
                )}
              </div>
            ))}
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
              <>Hoàn tất đăng ký <ArrowRight size={14} /></>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400 font-medium uppercase tracking-widest border-t border-gray-100 pt-8">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-black font-bold hover:underline underline-offset-4">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};