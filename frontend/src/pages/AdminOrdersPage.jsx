import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { Eye, Filter, Phone, MapPin, Package, Hash, User, CreditCard, X, ChevronRight } from 'lucide-react';

export const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const BASE_URL = "http://localhost:5000";

  const getImgUrl = (imageSource) => {
    let path = typeof imageSource === 'object' 
      ? (imageSource?.images?.[0] || imageSource?.mainImage) 
      : imageSource;
    if (!path) return 'https://placehold.co/400x500?text=No+Image';
    if (path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${BASE_URL}/${cleanPath}`;
  };

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    if (statusFilter === 'All') setFilteredOrders(orders);
    else setFilteredOrders(orders.filter(order => order.status === statusFilter));
  }, [statusFilter, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/orders/admin/all-orders');
      if (response.data.success) setOrders(response.data.data);
    } catch (error) {
      toast.error('Lỗi tải danh sách đơn hàng');
    } finally { setLoading(false); }
  };

  const handleUpdateStatus = async (orderId) => {
    if (!newStatus) return toast.error('Vui lòng chọn trạng thái');
    try {
      await axiosInstance.patch(`/orders/admin/update-status/${orderId}`, { status: newStatus });
      toast.success('Đã cập nhật!');
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) { toast.error('Cập nhật thất bại'); }
  };

  // 🚀 ĐÃ BỔ SUNG MÀU SẮC CHO 3 TRẠNG THÁI MỚI
  const getStatusBadge = (status) => {
    const statusMap = {
      Pending: 'text-amber-500 bg-amber-50',
      Confirmed: 'text-blue-500 bg-blue-50',
      Shipping: 'text-purple-500 bg-purple-50',
      Delivered: 'text-emerald-500 bg-emerald-50',
      Cancelled: 'text-red-400 bg-red-50',
      'Return Requested': 'text-orange-500 bg-orange-50',
      'Refund Processing': 'text-indigo-500 bg-indigo-50',
      'Returned': 'text-zinc-600 bg-zinc-200',
    };
    return statusMap[status] || 'text-zinc-400 bg-zinc-50';
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center text-[10px] font-bold tracking-[5px] text-zinc-300 uppercase animate-pulse">
      Đang đồng bộ vận đơn...
    </div>
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-12" style={{ fontFamily: "'Jost', sans-serif" }}>
      
      {/* 1. HEADER & FILTER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-zinc-100 pb-10">
        <div className="space-y-2">
          <h1 style={{ fontFamily: "'Montserrat', sans-serif" }} className="text-[24px] font-black uppercase tracking-[8px] text-black">
            Orders <span className="font-light text-zinc-300">Management</span>
          </h1>
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[3px]">Hệ thống có {orders.length} kiện hàng đang vận hành</p>
        </div>

        <div className="flex items-center gap-4 bg-zinc-50/50 p-1.5 rounded-full border border-zinc-100">
          <div className="pl-4"><Filter size={12} className="text-zinc-400" /></div>
          {/* 🚀 ĐÃ BỔ SUNG BỘ LỌC */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-[10px] font-bold uppercase tracking-widest text-zinc-500 cursor-pointer pr-8"
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="Pending">Chờ xử lý</option>
            <option value="Confirmed">Xác nhận</option>
            <option value="Shipping">Đang giao</option>
            <option value="Delivered">Đã nhận</option>
            <option value="Cancelled">Đã hủy</option>
            <option value="Return Requested">Yêu cầu trả hàng</option>
            <option value="Refund Processing">Đang xử lý hoàn tiền</option>
            <option value="Returned">Đã trả hàng</option>
          </select>
        </div>
      </div>

      {/* 2. TABLE LIST */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-3">
          <thead>
            <tr className="text-[9px] font-bold text-zinc-400 uppercase tracking-[3px]">
              <th className="px-6 pb-4">Vận đơn</th>
              <th className="px-6 pb-4">Khách hàng</th>
              <th className="px-6 pb-4">Tổng tiền</th>
              <th className="px-6 pb-4 text-center">Trạng thái</th>
              <th className="px-6 pb-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order._id} className="group bg-white hover:bg-zinc-50/50 transition-all border border-zinc-100 rounded-2xl shadow-sm">
                <td className="px-6 py-5 first:rounded-l-2xl border-y border-l border-zinc-100">
                  <span className="text-[10px] font-black tracking-tighter text-zinc-300 group-hover:text-black transition-colors">#{order._id.slice(-6).toUpperCase()}</span>
                </td>
                <td className="px-6 py-5 border-y border-zinc-100">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-tight text-black">{order.user?.fullName}</p>
                    <p className="text-[9px] text-zinc-400">{order.user?.email}</p>
                  </div>
                </td>
                <td className="px-6 py-5 border-y border-zinc-100">
                  <span className="text-[12px] font-black text-black tracking-tight">{order.totalAmount.toLocaleString('vi-VN')} đ</span>
                </td>
                <td className="px-6 py-5 border-y border-zinc-100 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-[2px] ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-5 last:rounded-r-2xl border-y border-r border-zinc-100 text-right">
                  <button
                    onClick={() => { setSelectedOrder(order); setNewStatus(order.status); }}
                    className="p-2.5 hover:bg-black hover:text-white rounded-full transition-all border border-zinc-100 group-hover:border-black"
                  >
                    <ChevronRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. REFINED MODAL (Xem chi tiết đơn) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center p-6 z-[200] animate-in fade-in duration-500">
          <div className="bg-white border border-zinc-100 rounded-[32px] p-12 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl shadow-zinc-200">
            
            <button onClick={() => setSelectedOrder(null)} className="absolute top-10 right-10 text-zinc-300 hover:text-black transition-colors">
              <X size={20} strokeWidth={1.5} />
            </button>

            {/* Modal Header */}
            <div className="space-y-2 mb-12">
              <div className="flex items-center gap-3 text-red-500">
                <Package size={16} />
                <h2 className="text-[14px] font-black uppercase tracking-[5px]">Chi tiết vận đơn</h2>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase text-zinc-300">ID: #{selectedOrder._id.toUpperCase()}</p>
                <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest italic">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
              {/* Cột trái: Thông tin giao hàng */}
              <div className="space-y-6">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[4px]">Thông tin nhận hàng</p>
                <div className="space-y-4">
                  <div className="pb-4 border-b border-zinc-50">
                    <p className="text-[8px] text-zinc-300 font-bold uppercase mb-1">Người nhận</p>
                    <p className="text-[12px] font-bold uppercase text-black">{selectedOrder.user?.fullName}</p>
                  </div>
                  <div className="pb-4 border-b border-zinc-50">
                    <p className="text-[8px] text-zinc-300 font-bold uppercase mb-1">Địa chỉ</p>
                    <p className="text-[11px] font-medium text-zinc-500 leading-relaxed uppercase tracking-wider">{selectedOrder.shippingAddress}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-zinc-300 font-bold uppercase mb-1">Liên hệ</p>
                    <p className="text-[13px] font-black tracking-[3px] text-black">{selectedOrder.phone}</p>
                  </div>
                </div>
              </div>

              {/* Cột phải: Xử lý trạng thái */}
              <div className="space-y-6">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[4px]">Điều phối vận hành</p>
                <div className="bg-zinc-50/50 p-8 rounded-3xl border border-zinc-100 space-y-6">
                  <div className="space-y-3">
                    <p className="text-[8px] text-zinc-300 font-bold uppercase">Trạng thái hiện tại</p>
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${getStatusBadge(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {/* 🚀 ĐÃ BỔ SUNG OPTION CẬP NHẬT TRẠNG THÁI */}
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full bg-white border border-zinc-100 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-black transition-all appearance-none cursor-pointer"
                    >
                      <option value="Pending">Chờ xử lý</option>
                      <option value="Confirmed">Đã xác nhận</option>
                      <option value="Shipping">Đang giao hàng</option>
                      <option value="Delivered">Giao thành công</option>
                      <option value="Cancelled">Hủy đơn hàng</option>
                      <option value="Return Requested">Yêu cầu trả hàng</option>
                      <option value="Refund Processing">Xử lý hoàn tiền</option>
                      <option value="Returned">Hoàn tất trả hàng</option>
                    </select>
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder._id)}
                      className="w-full bg-black text-white py-4 rounded-xl text-[9px] font-bold uppercase tracking-[3px] hover:bg-zinc-800 transition-all active:scale-95"
                    >
                      Cập nhật hệ thống
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="space-y-8">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[4px]">Kiện hàng soạn thảo</p>
              <div className="space-y-4">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-6 group">
                    <div className="w-14 h-18 bg-zinc-50 rounded-lg overflow-hidden border border-zinc-100 flex-shrink-0">
                      <img src={getImgUrl(item.product)} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" alt="" />
                    </div>
                    <div className="flex-grow space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-black">{item.product?.name}</p>
                      <div className="flex gap-4">
                        <span className="text-[9px] font-medium text-zinc-300 uppercase">Size: <span className="text-zinc-500 font-bold">{item.size}</span></span>
                        <span className="text-[9px] font-medium text-zinc-300 uppercase">Color: <span className="text-zinc-500 font-bold">{item.color}</span></span>
                        <span className="text-[9px] font-medium text-zinc-300 uppercase">Qty: <span className="text-zinc-500 font-bold">x{item.quantity}</span></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-black text-black">{(item.price * item.quantity).toLocaleString('vi-VN')} đ</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-10 border-t border-zinc-100 flex justify-between items-center">
                <p className="text-[10px] font-black uppercase tracking-[4px]">Tổng cộng giá trị</p>
                <p className="text-[20px] font-black text-black tracking-tighter">{selectedOrder.totalAmount.toLocaleString('vi-VN')} đ</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};