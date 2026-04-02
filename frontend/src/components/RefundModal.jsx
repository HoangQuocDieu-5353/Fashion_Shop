import { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { X, AlertCircle, UploadCloud, CheckCircle2, ImagePlus, Trash2 } from 'lucide-react';

export const RefundModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [reason, setReason] = useState('Sản phẩm lỗi');
  const [description, setDescription] = useState('');
  
  // 🚀 STATE MỚI: Xử lý file ảnh từ máy
  const [imagePreview, setImagePreview] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  // 🚀 HÀM ĐỌC FILE ẢNH & KIỂM TRA DUNG LƯỢNG
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate 1: Kiểm tra định dạng (Chỉ nhận ảnh)
    if (!file.type.startsWith('image/')) {
      return toast.error('Vui lòng chỉ chọn file hình ảnh (JPG, PNG...)');
    }

    // Validate 2: Giới hạn dung lượng < 2MB để tránh nặng Database
    if (file.size > 2 * 1024 * 1024) {
      return toast.error('Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB');
    }

    // Đọc file và chuyển thành Base64 (Data URL)
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result); // Lưu chuỗi Base64 vào state để hiện xem trước và gửi đi
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🚀 HÀM VALIDATION CHẶT CHẼ
    if (!reason) {
      return toast.error('Vui lòng chọn lý do đổi trả');
    }
    if (!description || description.trim().length < 10) {
      return toast.error('Vui lòng mô tả chi tiết lỗi (ít nhất 10 ký tự)');
    }
    if (!imagePreview) {
      return toast.error('Bắt buộc phải có ảnh minh họa tình trạng sản phẩm!');
    }

    // 🚀 FIX LỖI 500 Ở ĐÂY: Bảo vệ mảng items cực kỳ cẩn thận
    // Thay vì dùng .map ngay, ta kiểm tra xem order.items có tồn tại và là mảng không
    let itemsToRefund = [];
    if (order && Array.isArray(order.items)) {
      itemsToRefund = order.items.map(item => ({
        product: item.product?._id || item.product,
        variant: item.variant?._id || item.variant,
        quantity: item.quantity,
        price: item.price
      }));
    }

    try {
      setIsSubmitting(true);
      const { data } = await axiosInstance.post('/refunds/request', {
        orderId: order._id,
        items: itemsToRefund,
        reason,
        description,
        images: [imagePreview] 
      });

      if (data.success) {
        toast.success('Gửi yêu cầu đổi trả thành công!');
        onSuccess(); 
        
        // Reset form và đóng modal
        setDescription('');
        setImagePreview(null);
        onClose();   
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu');
      console.error("Lỗi từ server:", error); // Log ra để xem chi tiết nếu vẫn lỗi 500
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" />
              Yêu cầu đổi trả
            </h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
              Đơn hàng #{order._id.slice(-6)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-200 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Lý do */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Lý do đổi trả *</label>
            <select 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-sm font-bold text-black rounded-xl p-3 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all appearance-none cursor-pointer"
            >
              <option value="Sản phẩm lỗi">Sản phẩm lỗi (Rách, xước, bẩn...)</option>
              <option value="Giao sai mẫu">Giao sai mẫu / sai màu</option>
              <option value="Không vừa size">Không vừa size</option>
              <option value="Khác">Lý do khác</option>
            </select>
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Mô tả tình trạng *</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Vui lòng mô tả chi tiết lỗi... (VD: Áo bị rách ở phần nách, màu nhạt hơn hình ảnh...)"
              className="w-full bg-zinc-50 border border-zinc-200 text-sm rounded-xl p-3 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all min-h-[100px]"
            ></textarea>
          </div>

          {/* 🚀 Khu vực Upload Ảnh */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
              Ảnh minh họa lỗi (Bắt buộc) *
            </label>
            
            {imagePreview ? (
              // Nếu đã có ảnh -> Hiện ảnh xem trước và nút xóa
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-zinc-200 group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 hover:scale-110 transition-all shadow-lg"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ) : (
              // Nếu chưa có ảnh -> Hiện nút chọn file
              <label className="w-full h-32 border-2 border-dashed border-zinc-300 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-black hover:bg-zinc-50 transition-all text-zinc-400 hover:text-black">
                <ImagePlus size={28} />
                <span className="text-xs font-bold uppercase tracking-widest">Tải ảnh lên từ máy</span>
                <span className="text-[10px] font-medium">(JPG, PNG - Tối đa 2MB)</span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden" 
                />
              </label>
            )}
          </div>

          {/* Nút Submit */}
          <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 bg-zinc-100 text-zinc-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-3 bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Đang gửi...' : <><CheckCircle2 size={16} /> Gửi yêu cầu</>}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};