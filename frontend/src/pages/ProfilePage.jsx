import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import axiosInstance from '../api/axiosInstance';
import { User, Lock, Camera, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
  const { user, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // State cho thông tin cá nhân
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
  });

  // State cho đổi mật khẩu
  const [pwdData, setPwdData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // 📸 XỬ LÝ TẢI ẢNH AVATAR
  const handleAvatarClick = () => {
    fileInputRef.current.click(); // Kích hoạt chọn file khi nhấn vào ảnh
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra định dạng và dung lượng (Dưới 2MB)
    if (!file.type.startsWith('image/')) return toast.error('Vui lòng chọn file ảnh');
    if (file.size > 2 * 1024 * 1024) return toast.error('Ảnh không được quá 2MB');

    const uploadData = new FormData();
    uploadData.append('avatar', file);

    setIsUploading(true);
    try {
      // Gửi file lên backend bằng axiosInstance
      const res = await axiosInstance.patch('/users/profile', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        toast.success('Đã cập nhật ảnh đại diện');
        // Gọi lại hàm cập nhật profile từ useAuth để cập nhật state toàn cục
        await updateProfile({}); 
      }
    } catch (error) {
      toast.error('Lỗi khi tải ảnh lên máy chủ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success('Cập nhật hồ sơ thành công');
    } catch (error) {
      toast.error('Lỗi cập nhật hồ sơ');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      return toast.error('Mật khẩu mới không khớp');
    }
    if (pwdData.newPassword.length < 6) {
      return toast.error('Mật khẩu mới phải từ 6 ký tự');
    }

    try {
      await axiosInstance.post('/users/change-password', pwdData);
      toast.success('Đổi mật khẩu thành công');
      setPwdData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mật khẩu cũ không chính xác');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="space-y-16">
        {/* 🚀 PHẦN 1: THÔNG TIN CÁ NHÂN */}
        <section className="space-y-8">
          <div className="flex justify-between items-end border-b pb-4">
            <h2 className="text-[14px] font-bold uppercase tracking-[3px] flex items-center gap-2">
              <User size={16} /> Thông tin cá nhân
            </h2>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-[11px] font-bold uppercase tracking-widest hover:text-gray-500 transition"
              >
                Chỉnh sửa thông tin
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            {/* Avatar Section */}
            <div className="md:col-span-4 flex flex-col items-center space-y-4">
              <div 
                onClick={handleAvatarClick}
                className="w-40 h-40 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center relative group overflow-hidden cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin text-gray-400" size={32} />
                ) : user?.avatar ? (
                  <img 
                    src={`http://localhost:5000${user.avatar}`} 
                    alt="Avatar" 
                    className="w-full h-full object-cover transition group-hover:scale-110"
                    onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + user.fullName }}
                  />
                ) : (
                  <User size={48} className="text-gray-200" />
                )}
                
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Camera size={24} className="text-white mb-1" />
                  <span className="text-[8px] text-white font-bold uppercase tracking-widest">Thay đổi</span>
                </div>
              </div>
              
              {/* Input File ẩn */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
              
              <div className="text-center">
                <p className="text-[12px] font-bold uppercase tracking-widest">{user?.fullName}</p>
                <p className="text-[10px] text-gray-400 font-bold tracking-tighter italic mt-1">HUTECH 2022 - {user?.role}</p>
              </div>
            </div>

            {/* Form Info */}
            <form onSubmit={handleProfileSubmit} className="md:col-span-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Họ và tên</label>
                {isEditing ? (
                  <input 
                    name="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition text-[13px]"
                  />
                ) : (
                  <p className="text-[14px] font-bold py-2">{user?.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Địa chỉ Email</label>
                <p className="text-[14px] font-medium text-gray-500 py-2 italic">{user?.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Số điện thoại</label>
                {isEditing ? (
                  <input 
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition text-[13px]"
                  />
                ) : (
                  <p className="text-[14px] font-bold py-2">{user?.phone || 'Chưa cập nhật'}</p>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={loading} className="bg-black text-white px-8 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 transition">Lưu thay đổi</button>
                  <button type="button" onClick={() => setIsEditing(false)} className="border px-8 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-50 transition">Hủy</button>
                </div>
              )}
            </form>
          </div>
        </section>

        {/* 🔒 PHẦN 2: BẢO MẬT & ĐỔI MẬT KHẨU */}
        <section className="space-y-8 pt-8">
          <h2 className="text-[14px] font-bold uppercase tracking-[3px] border-b pb-4 flex items-center gap-2">
            <Lock size={16} /> Bảo mật tài khoản
          </h2>

          <form onSubmit={handlePasswordSubmit} className="max-w-xl space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mật khẩu cũ</label>
              <input 
                type="password"
                required
                placeholder="••••••••"
                value={pwdData.oldPassword}
                onChange={(e) => setPwdData({...pwdData, oldPassword: e.target.value})}
                className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition text-[13px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mật khẩu mới</label>
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={pwdData.newPassword}
                  onChange={(e) => setPwdData({...pwdData, newPassword: e.target.value})}
                  className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition text-[13px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Xác nhận mật khẩu</label>
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={pwdData.confirmPassword}
                  onChange={(e) => setPwdData({...pwdData, confirmPassword: e.target.value})}
                  className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition text-[13px]"
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                className="border-2 border-black px-10 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
              >
                Cập nhật mật khẩu
              </button>
            </div>
          </form>

          <div className="bg-gray-50 p-6 flex items-start gap-4 border border-gray-100">
            <ShieldCheck size={20} className="text-black shrink-0" />
            <p className="text-[10px] text-gray-500 leading-relaxed font-medium uppercase tracking-tight">
              Chúng tôi khuyên ông giáo nên đổi mật khẩu định kỳ 6 tháng một lần để bảo vệ tài khoản và thông tin cá nhân.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};