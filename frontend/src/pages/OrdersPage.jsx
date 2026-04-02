import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { 
  Package, Clock, Truck, CheckCircle, XCircle, 
  ShoppingBag, CheckCircle2, AlertCircle, RefreshCcw, PackageCheck 
} from 'lucide-react';
import { RefundModal } from '../components/RefundModal';
import { useSocket } from '../context/SocketContext'; // 🚀 ĐẢM BẢO IMPORT ĐÚNG HOOK SOCKET

export const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket(); // 🚀 LẤY SOCKET RA XÀI
  
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState(null);
  
  const BASE_URL = "http://localhost:5000";

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🚀 LOGIC REAL-TIME: NGHE TÍN HIỆU CẬP NHẬT TRẠNG THÁI
  useEffect(() => {
    if (socket) {
      socket.on('order_status_updated', (data) => {
        // "Vả" trạng thái mới vào đúng đơn hàng trong danh sách mà không cần gọi API lại
        setOrders((prevOrders) => 
          prevOrders.map((order) => 
            order._id === data.orderId 
              ? { ...order, status: data.newStatus } 
              : order
          )
        );
        
        // Hiện thông báo cho khách hàng biết
        toast.success(`Đơn hàng #${data.orderId.slice(-6)} của bạn đã có cập nhật mới!`, {
          icon: '🔔',
          duration: 4000
        });
      });

      // Quan trọng: Dọn dẹp listener khi đóng trang để tránh bị nghe trùng/rò rỉ bộ nhớ
      return () => socket.off('order_status_updated');
    }
  }, [socket]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/orders/my-orders');
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      toast.error('Lỗi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const getImgUrl = (item) => {
    const path = item.variant?.image || item.product?.images?.[0];
    if (!path) return 'https://placehold.co/400x500?text=No+Image';
    return path.startsWith('http') ? path : `${BASE_URL}/${path.replace(/^\//, '')}`;
  };

  const getStatusDetails = (status) => {
    const statusMap = {
      Pending: { color: 'bg-amber-100 text-amber-700', icon: <Clock size={14} />, text: 'Chờ xác nhận' },
      Confirmed: { color: 'bg-blue-100 text-blue-700', icon: <Package size={14} />, text: 'Đã xác nhận' },
      Shipping: { color: 'bg-purple-100 text-purple-700', icon: <Truck size={14} />, text: 'Đang giao hàng' },
      Delivered: { color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} />, text: 'Đã giao' },
      Cancelled: { color: 'bg-red-100 text-red-700', icon: <XCircle size={14} />, text: 'Đã hủy' },
      'Return Requested': { color: 'bg-orange-100 text-orange-700', icon: <AlertCircle size={14} />, text: 'Đang chờ duyệt đổi trả' },
      'Refund Processing': { color: 'bg-blue-100 text-blue-700', icon: <RefreshCcw size={14} />, text: 'Đang xử lý hoàn tiền' },
      Returned: { color: 'bg-zinc-200 text-zinc-600', icon: <PackageCheck size={14} />, text: 'Đã trả hàng' },
    };
    return statusMap[status] || { color: 'bg-gray-100 text-gray-800', icon: null, text: status };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 animate-pulse">
        <Package className="w-12 h-12 text-zinc-200 mb-4" />
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Đang tìm đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-black">
          Lịch sử mua hàng
        </h1>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          {orders.length} Đơn hàng
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-zinc-50 rounded-[40px] p-20 text-center border-2 border-dashed border-zinc-100">
          <ShoppingBag className="mx-auto w-16 h-16 text-zinc-200 mb-6" />
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Chưa có chiến lợi phẩm nào!</p>
          <Link to="/products" className="mt-8 inline-block bg-black text-white px-10 py-4 text-[11px] font-bold uppercase tracking-[3px] hover:bg-zinc-800 transition">
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {orders.map((order) => {
            const status = getStatusDetails(order.status);
            return (
              <div key={order._id} className="bg-white border border-zinc-100 overflow-hidden hover:shadow-xl hover:shadow-zinc-100/50 transition-all duration-500 rounded-3xl">
                
                <div className="p-6 bg-zinc-50/50 flex flex-wrap justify-between items-center gap-4 border-b border-zinc-100">
                  <div className="flex gap-10">
                    <div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[2px] mb-1">Mã Đơn</p>
                      <p className="font-bold text-black text-xs">#{order._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[2px] mb-1">Ngày Đặt</p>
                      <p className="font-bold text-black text-xs">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status.color}`}>
                    {status.icon} {status.text}
                  </span>
                </div>

                <div className="p-8 space-y-6">
                  {order.items?.map((item) => (
                    <div key={item._id} className="flex items-center gap-6 group">
                      <div className="w-16 h-20 rounded-xl overflow-hidden bg-zinc-50 flex-shrink-0 border border-zinc-100">
                        <img 
                          src={getImgUrl(item)} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          alt={item.product?.name} 
                        />
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold text-sm text-black uppercase tracking-tight line-clamp-1">{item.product?.name}</p>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                          Size: <span className="text-black">{item.size}</span> | Màu: <span className="text-black">{item.color}</span> | SL: <span className="text-black">{item.quantity}</span>
                        </p>
                      </div>
                      <div className="font-black text-sm text-black">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 lg:p-8 bg-zinc-50/20 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-end gap-6">
                  <div className="w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[2px] mb-1">Thanh toán qua</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-black uppercase">
                        <CheckCircle2 size={14} className="text-green-500" /> {order.paymentMethod}
                      </div>
                    </div>

                    {order.status === 'Delivered' && (
                      <button 
                        onClick={() => {
                          setSelectedOrderForRefund(order);
                          setRefundModalOpen(true);
                        }}
                        className="px-5 py-2.5 bg-white border border-red-200 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50 transition-all flex items-center gap-2"
                      >
                        <AlertCircle size={14} /> Yêu cầu đổi trả
                      </button>
                    )}
                  </div>

                  <div className="text-right w-full sm:w-auto">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Tổng cộng</p>
                    <p className="text-2xl font-black text-black tracking-tighter">
                      {order.totalAmount.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      <RefundModal 
        isOpen={refundModalOpen} 
        onClose={() => {
          setRefundModalOpen(false);
          setSelectedOrderForRefund(null);
        }} 
        order={selectedOrderForRefund} 
        onSuccess={fetchOrders} 
      />
    </div>
  );
};