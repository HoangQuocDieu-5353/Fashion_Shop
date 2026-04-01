import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { Ticket, Plus, Edit2, Trash2, X, CheckCircle, XCircle } from 'lucide-react';

export const AdminCouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State cho Modal Thêm/Sửa
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percent',
    discountValue: '',
    maxDiscount: '',
    minOrderValue: 0,
    endDate: '',
    usageLimit: '',
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/coupons');
      if (res.data.success) {
        setCoupons(res.data.data);
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openModalForAdd = () => {
    setEditingId(null);
    setFormData({
      code: '',
      discountType: 'percent',
      discountValue: '',
      maxDiscount: '',
      minOrderValue: 0,
      endDate: '',
      usageLimit: '',
      isActive: true
    });
    setShowModal(true);
  };

  const openModalForEdit = (coupon) => {
    setEditingId(coupon._id);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount || '',
      minOrderValue: coupon.minOrderValue || 0,
      endDate: new Date(coupon.endDate).toISOString().split('T')[0], // Format ra YYYY-MM-DD cho input type="date"
      usageLimit: coupon.usageLimit || '',
      isActive: coupon.isActive
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Làm sạch data trước khi gửi
      const payload = { ...formData };
      if (!payload.maxDiscount) payload.maxDiscount = null;
      if (!payload.usageLimit) payload.usageLimit = null;

      if (editingId) {
        const res = await axiosInstance.put(`/coupons/${editingId}`, payload);
        if (res.data.success) toast.success('Cập nhật mã thành công');
      } else {
        const res = await axiosInstance.post('/coupons', payload);
        if (res.data.success) toast.success('Tạo mã mới thành công');
      }
      setShowModal(false);
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa vĩnh viễn mã giảm giá này?')) return;
    try {
      const res = await axiosInstance.delete(`/coupons/${id}`);
      if (res.data.success) {
        toast.success('Đã xóa mã giảm giá');
        setCoupons(coupons.filter(c => c._id !== id));
      }
    } catch (error) {
      toast.error('Lỗi khi xóa');
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-zinc-400 uppercase tracking-[3px] text-[10px] animate-pulse">ĐANG TẢI DỮ LIỆU...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 selection:bg-black selection:text-white">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10 h-20 border-b border-zinc-100">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-1 text-black">🎫 Quản lý Mã Giảm Giá</h1>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[2px]">Đang có {coupons.length} mã trên hệ thống</p>
        </div>
        <button 
          onClick={openModalForAdd}
          className="bg-black text-white px-6 py-3.5 rounded-full font-black text-[11px] uppercase tracking-[2px] hover:bg-zinc-800 transition flex items-center gap-2 shadow-lg shadow-black/10"
        >
          <Plus size={16} /> THÊM MÃ MỚI
        </button>
      </div>

      {/* DANH SÁCH COUPON */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.length === 0 ? (
          <div className="col-span-full bg-white p-20 rounded-3xl border text-center text-zinc-300 text-[10px] uppercase font-black tracking-[4px]">Chưa có mã giảm giá nào.</div>
        ) : (
          coupons.map((coupon) => {
            const isExpired = new Date(coupon.endDate) < new Date();
            const isOutOfStock = coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit;
            const statusColor = (!coupon.isActive || isExpired || isOutOfStock) ? 'text-zinc-400 bg-zinc-100' : 'text-green-600 bg-green-50';

            return (
              <div key={coupon._id} className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 flex flex-col transition-all hover:border-zinc-300 relative overflow-hidden">
                {/* Dấu gạch chéo nếu hết hạn/tắt */}
                {(!coupon.isActive || isExpired) && <div className="absolute top-4 right-[-30px] bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-10 py-1 rotate-45 z-10">NGƯNG HĐ</div>}
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center border-2 border-dashed border-zinc-500">
                      <Ticket size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-widest text-black">{coupon.code}</h3>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest mt-1 ${statusColor}`}>
                        {coupon.isActive ? (isExpired ? 'Hết hạn' : isOutOfStock ? 'Hết lượt' : 'Đang chạy') : 'Tạm khóa'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6 flex-grow">
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[2px] mb-1">Mức giảm</p>
                    <p className="text-xl font-black text-black">
                      {coupon.discountType === 'percent' ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString()}đ`}
                    </p>
                    {coupon.maxDiscount && <p className="text-[10px] text-zinc-500 font-medium mt-1">Tối đa: {coupon.maxDiscount.toLocaleString()}đ</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-[11px] text-zinc-600 font-medium">
                    <div>
                      <p className="text-zinc-400 font-bold uppercase tracking-[1px] text-[9px] mb-1">Đơn tối thiểu</p>
                      {coupon.minOrderValue.toLocaleString()}đ
                    </div>
                    <div>
                      <p className="text-zinc-400 font-bold uppercase tracking-[1px] text-[9px] mb-1">Hạn sử dụng</p>
                      {new Date(coupon.endDate).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="col-span-2">
                      <p className="text-zinc-400 font-bold uppercase tracking-[1px] text-[9px] mb-1">Lượt dùng</p>
                      <div className="w-full bg-zinc-100 rounded-full h-2 mt-1.5 mb-1 overflow-hidden">
                        <div className="bg-black h-2 rounded-full" style={{ width: coupon.usageLimit ? `${(coupon.usedCount / coupon.usageLimit) * 100}%` : '100%' }}></div>
                      </div>
                      {coupon.usedCount} / {coupon.usageLimit || '∞'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-zinc-100">
                  <button onClick={() => openModalForEdit(coupon)} className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2">
                    <Edit2 size={14} /> Sửa
                  </button>
                  <button onClick={() => handleDelete(coupon._id)} className="w-10 h-10 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition flex items-center justify-center shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL THÊM / SỬA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-zinc-100 p-6 flex justify-between items-center z-10">
              <h2 className="text-lg font-black uppercase tracking-tight">{editingId ? 'Chỉnh sửa Mã' : 'Tạo Mã Giảm Giá Mới'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition text-zinc-400 hover:text-black"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[2px] mb-2">Mã Code (In hoa, Liền nhau)</label>
                  <input type="text" name="code" value={formData.code} onChange={handleInputChange} required className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-sm font-bold uppercase outline-none focus:border-black transition" placeholder="VD: SUMMER50" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[2px] mb-2">Loại giảm giá</label>
                  <select name="discountType" value={formData.discountType} onChange={handleInputChange} className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-sm font-bold outline-none focus:border-black transition">
                    <option value="percent">Theo phần trăm (%)</option>
                    <option value="fixed">Trừ tiền mặt (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[2px] mb-2">Mức giảm</label>
                  <input type="number" name="discountValue" value={formData.discountValue} onChange={handleInputChange} required min="1" className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-sm font-bold outline-none focus:border-black transition" placeholder={formData.discountType === 'percent' ? 'VD: 10 (%)' : 'VD: 50000 (đ)'} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[2px] mb-2">Giảm tối đa (Nếu có)</label>
                  <input type="number" name="maxDiscount" value={formData.maxDiscount} onChange={handleInputChange} min="0" disabled={formData.discountType === 'fixed'} className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-sm font-bold outline-none focus:border-black transition disabled:opacity-50" placeholder="Chỉ áp dụng cho (%)" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[2px] mb-2">Đơn hàng tối thiểu</label>
                  <input type="number" name="minOrderValue" value={formData.minOrderValue} onChange={handleInputChange} min="0" className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-sm font-bold outline-none focus:border-black transition" placeholder="VD: 200000" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[2px] mb-2">Ngày hết hạn</label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} required className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-sm font-bold outline-none focus:border-black transition" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[2px] mb-2">Giới hạn số lượt xài</label>
                  <input type="number" name="usageLimit" value={formData.usageLimit} onChange={handleInputChange} min="1" className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-sm font-bold outline-none focus:border-black transition" placeholder="Bỏ trống = Không giới hạn" />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-5 h-5 accent-black cursor-pointer" />
                  <label htmlFor="isActive" className="text-sm font-bold cursor-pointer">Kích hoạt mã này ngay</label>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100 flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-zinc-100 hover:bg-zinc-200 text-black rounded-xl font-black text-[11px] uppercase tracking-[2px] transition">Hủy</button>
                <button type="submit" className="flex-1 py-4 bg-black hover:bg-zinc-800 text-white rounded-xl font-black text-[11px] uppercase tracking-[2px] transition">{editingId ? 'Lưu Thay Đổi' : 'Tạo Mã Giảm Giá'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};