import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { 
  RefreshCcw, Eye, CheckCircle2, XCircle, 
  Clock, PackageCheck, AlertCircle, Search 
} from 'lucide-react';

export const AdminRefundManager = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/refunds/admin/all');
      if (data.success) {
        setRefunds(data.data);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách đổi trả');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Xác nhận chuyển yêu cầu này sang trạng thái: ${status}?`)) return;
    
    try {
      setIsUpdating(true);
      const { data } = await axiosInstance.patch(`/refunds/admin/update/${id}`, {
        status,
        adminNote
      });

      if (data.success) {
        toast.success(`Đã cập nhật trạng thái thành ${status}`);
        setSelectedRefund(null);
        setAdminNote('');
        fetchRefunds(); // Load lại bảng
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật');
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper render Badge trạng thái
  const StatusBadge = ({ status }) => {
    const config = {
      Pending: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Chờ duyệt' },
      Approved: { color: 'bg-blue-100 text-blue-700', icon: RefreshCcw, label: 'Đang xử lý' },
      Completed: { color: 'bg-emerald-100 text-emerald-700', icon: PackageCheck, label: 'Đã hoàn tất' },
      Rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Từ chối' },
    };
    const { color, icon: Icon, label } = config[status] || config.Pending;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${color}`}>
        <Icon size={12} strokeWidth={2.5} />
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-black">Quản lý Đổi Trả</h1>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
            {refunds.length} Yêu cầu trong hệ thống
          </p>
        </div>
        <button 
          onClick={fetchRefunds}
          className="p-3 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all text-black shadow-sm"
        >
          <RefreshCcw size={18} />
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100 text-[10px] uppercase tracking-widest text-zinc-400 font-black">
                <th className="p-4">Mã YC / Đơn Hàng</th>
                <th className="p-4">Khách Hàng</th>
                <th className="p-4">Lý Do</th>
                <th className="p-4 text-right">Số Tiền Hoàn</th>
                <th className="p-4 text-center">Trạng Thái</th>
                <th className="p-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs animate-pulse">Đang tải dữ liệu...</td></tr>
              ) : refunds.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs">Không có yêu cầu nào</td></tr>
              ) : (
                refunds.map((refund) => (
                  <tr key={refund._id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-black text-xs text-black uppercase">{refund._id.slice(-6)}</p>
                      <p className="text-[10px] text-zinc-400 font-bold tracking-wider mt-0.5">Order: {refund.order?._id.slice(-6)}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-xs text-black">{refund.user?.fullName}</p>
                      <p className="text-[10px] text-zinc-400">{refund.user?.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2 py-1 rounded-md">
                        <AlertCircle size={12} /> {refund.reason}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-red-500">
                      {refund.totalRefundAmount?.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge status={refund.status} />
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setSelectedRefund(refund)}
                        className="p-2 bg-black text-white rounded-lg hover:bg-zinc-800 transition-all shadow-md"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CHI TIẾT */}
      {selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Chi tiết yêu cầu #{selectedRefund._id.slice(-6)}</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Đơn hàng gốc: {selectedRefund.order?._id}</p>
              </div>
              <button onClick={() => setSelectedRefund(null)} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-all">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Khách hàng</p>
                  <p className="text-sm font-bold">{selectedRefund.user?.fullName}</p>
                  <p className="text-xs text-zinc-500">{selectedRefund.user?.email}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Cần hoàn tiền</p>
                  <p className="text-lg font-black text-red-600">{selectedRefund.totalRefundAmount?.toLocaleString('vi-VN')}đ</p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Chi tiết lỗi</p>
                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-sm">
                  <p className="font-bold text-black mb-1">Lý do: {selectedRefund.reason}</p>
                  <p className="text-zinc-600 italic">{selectedRefund.description || 'Không có mô tả thêm'}</p>
                </div>
              </div>

              {/* Images */}
              {selectedRefund.images?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Hình ảnh chứng minh</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedRefund.images.map((img, idx) => (
                      <img key={idx} src={img} alt="Lỗi" className="w-24 h-24 object-cover rounded-xl border border-zinc-200" />
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Note */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Ghi chú của Admin (Gửi cho khách)</p>
                <textarea 
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Nhập lý do từ chối hoặc hướng dẫn gửi hàng về..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-black focus:ring-1 focus:ring-black transition-all min-h-[80px]"
                ></textarea>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-3">
              {selectedRefund.status === 'Pending' && (
                <>
                  <button 
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(selectedRefund._id, 'Rejected')}
                    className="px-6 py-2.5 bg-white border-2 border-red-500 text-red-500 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-50 transition-all"
                  >
                    Từ chối
                  </button>
                  <button 
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(selectedRefund._id, 'Approved')}
                    className="px-6 py-2.5 bg-black text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Phê duyệt
                  </button>
                </>
              )}
              {selectedRefund.status === 'Approved' && (
                <button 
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus(selectedRefund._id, 'Completed')}
                  className="px-6 py-2.5 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2"
                >
                  <PackageCheck size={16} /> Đã nhận hàng & Hoàn tiền
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};