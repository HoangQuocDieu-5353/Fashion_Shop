import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Phone, Lock, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const RegisterPage = () => {
  const { register, loading } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);  
  const [userEmail, setUserEmail] = useState(''); 
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      // Gọi hàm register từ AuthContext
      const response = await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });

      if (response?.success) {
        setUserEmail(formData.email);
        setIsSubmitted(true); 
        toast.success('Đăng ký thành công!');
      }
    } catch (error) {
      // Lỗi đã được toast ở AuthContext nên ở đây chỉ cần bắt để dừng loading
      console.error("Lỗi submit đăng ký:", error);
    }
  };

  // GIAO DIỆN THÀNH CÔNG (CHECK EMAIL)
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-[450px] w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center">
            <div className="bg-black p-6 rounded-full text-white shadow-2xl">
              <Mail size={40} strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase tracking-[4px]">Xác thực Email</h2>
            <p className="text-[13px] text-gray-500 leading-relaxed uppercase tracking-wider">
              Một liên kết xác thực đã được gửi tới:<br />
              <span className="text-black font-bold">{userEmail}</span>
            </p>
            <p className="text-[11px] text-gray-400 italic">
              Vui lòng kiểm tra hộp thư (hoặc thư rác) để hoàn tất kích hoạt tài khoản.
            </p>
          </div>
          <Link to="/login" className="inline-block bg-black text-white px-10 py-4 text-[11px] font-bold uppercase tracking-[3px] hover:bg-gray-800 transition-all">
            Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  // GIAO DIỆN FORM ĐĂNG KÝ
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-20">
      <div className="max-w-[450px] w-full space-y-12">
        <div className="text-center space-y-2">
          <h1 className="text-[24px] font-bold uppercase tracking-[6px] text-black">Khởi tạo tài khoản</h1>
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest">
            Gia nhập cộng đồng thời trang HUTECH 2022
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 gap-y-6">
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