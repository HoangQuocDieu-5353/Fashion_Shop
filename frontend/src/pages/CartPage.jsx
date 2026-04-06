import { useState, useEffect, useMemo } from 'react'; // Thêm useMemo
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useCart } from '../context/CartContext';
import { Minus, Plus, X, ArrowRight, AlertTriangle } from 'lucide-react'; // Thêm AlertTriangle
import toast from 'react-hot-toast';

export const CartPage = () => {
  const navigate = useNavigate();
  const { fetchCartCount } = useCart();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const BASE_URL = "http://localhost:5000";

  // 🚀 HELPER: Đảm bảo link ảnh luôn đúng (Xử lý lỗi thiếu/thừa dấu /)
  // Nhận ảnh từ item.product.images[0]
  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/200x250?text=No+Image";
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/carts');
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi tải giỏ hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // 🚀 Logic tính tổng (Đã bọc kỹ để không crash khi product null)
  const subtotal = useMemo(() => {
    return cart?.items?.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0) || 0;
  }, [cart]);

  // 🚀 Kiểm tra xem giỏ hàng có món nào bị xóa không để chặn checkout
  const hasDeletedItem = useMemo(() => {
    return cart?.items?.some(item => 
      !item.product || item.product.isDeleted === true // Đổi isDeleted thành trường của ông
    );
  }, [cart]);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (updatingId || newQuantity < 1) return;
    try {
      setUpdatingId(itemId);
      const res = await axiosInstance.put(`/carts/update/${itemId}`, { quantity: newQuantity });
      if (res.data.success) {
        setCart(res.data.data);
        fetchCartCount();
      }
    } catch (error) {
      toast.error("Lỗi cập nhật số lượng");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm("Xóa sản phẩm này?")) return;
    try {
      const res = await axiosInstance.delete(`/carts/remove/${itemId}`);
      if (res.data.success) {
        setCart(res.data.data);
        fetchCartCount();
        toast.success("Đã xóa");
      }
    } catch (error) {
      toast.error("Lỗi xóa sản phẩm");
    }
  };

  if (loading && !cart) return <div className="h-screen flex items-center justify-center text-[11px] font-bold tracking-[2px]">ĐANG TẢI...</div>;

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center space-y-6">
        <h1 className="text-[14px] font-bold text-gray-900 uppercase tracking-[3px]">Giỏ hàng của bạn đang trống</h1>
        <Link to="/products" className="inline-block bg-black text-white px-10 py-4 text-[11px] font-bold uppercase tracking-[2px] hover:bg-gray-800 transition">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <nav className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-[2px] mb-12">
        <Link to="/" className="hover:text-black">Trang chủ</Link>
        <span>/</span>
        <span className="text-gray-900 font-bold">Giỏ hàng</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
          <div className="hidden md:grid grid-cols-12 pb-4 border-b text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <div className="col-span-6">Sản phẩm</div>
            <div className="col-span-2 text-center">Giá</div>
            <div className="col-span-2 text-center">Số lượng</div>
            <div className="col-span-2 text-right">Tổng</div>
          </div>

          {cart.items.map((item) => {
            const isProductUnavailable = !item.product || item.product.isDeleted === true;
            if (isProductUnavailable) {
              return (
                <div key={item._id} className="grid grid-cols-12 gap-4 items-center pb-8 border-b border-red-100 bg-red-50/30 p-4">
                  <div className="col-span-10 flex items-center gap-4">
                    <AlertTriangle className="text-red-500" size={20} />
                    <div>
                      <h3 className="text-[11px] font-bold text-red-600 uppercase">Sản phẩm này đã ngừng kinh doanh</h3>
                      <p className="text-[10px] text-gray-400 italic">Vui lòng gỡ bỏ khỏi giỏ hàng để tiếp tục</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <button onClick={() => handleRemoveItem(item._id)} className="text-[10px] font-black underline uppercase text-red-600 hover:text-red-800 transition-colors">
                      Gỡ bỏ
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={item._id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pb-8 border-b border-gray-100 relative">
                <div className="col-span-6 flex gap-4">
                  <div className="w-20 h-24 bg-gray-50 shrink-0 overflow-hidden">
                    <img 
                      src={getImageUrl(item.product.images?.[0])}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" 
                      alt={item.product.name}
                      onError={(e) => { 
                        // 🚀 Chốt chặn an toàn: Chỉ chạy 1 lần
                        if (!e.target.dataset.error) {
                          e.target.dataset.error = "true";
                          e.target.src = "https://placehold.co/200x250/eeeeee/999999?text=Loi+Anh"; 
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col justify-between py-1">
                    <div>
                      <h3 className="text-[11px] font-bold text-gray-900 uppercase leading-tight tracking-wide">{item.product.name}</h3>
                      <p className="text-[10px] text-gray-400 font-medium uppercase mt-2">
                        {item.color} / {item.size}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleRemoveItem(item._id)}
                      className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase tracking-tighter flex items-center gap-1 transition-all"
                    >
                      <X size={12} /> Xóa khỏi giỏ
                    </button>
                  </div>
                </div>

                <div className="col-span-2 text-center hidden md:block text-[12px] font-medium">
                  {item.product.price.toLocaleString('vi-VN')}đ
                </div>

                <div className="col-span-2 flex justify-center">
                  <div className="flex items-center border border-gray-200">
                    <button 
                      onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                      className="p-2 hover:bg-gray-50 text-gray-400"
                    >
                      <Minus size={12}/>
                    </button>
                    <span className="w-8 text-center text-[12px] font-bold">{item.quantity}</span>
                    <button 
                      onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                      className="p-2 hover:bg-gray-50 text-gray-400"
                    >
                      <Plus size={12}/>
                    </button>
                  </div>
                </div>

                <div className="col-span-2 text-right text-[12px] font-bold">
                  {(item.product.price * item.quantity).toLocaleString('vi-VN')}đ
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-4">
          <div className="border p-8 space-y-8 bg-white sticky top-24">
            <h2 className="text-[14px] font-bold uppercase tracking-[3px] border-b pb-4 text-center">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-4 text-[11px] font-bold uppercase tracking-widest">
              <div className="flex justify-between text-gray-400">
                <span>Tạm tính</span>
                <span className="text-black">{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Vận chuyển</span>
                <span className="text-green-600">Miễn phí</span>
              </div>
              
              <div className="pt-6 border-t-2 border-black flex justify-between items-center text-black">
                <span className="text-[13px]">Tổng cộng</span>
                <span className="text-xl font-black">{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            {/* 🚀 CHẶN THANH TOÁN NẾU CÓ LỖI */}
            <button 
              disabled={hasDeletedItem}
              onClick={() => navigate('/checkout')}
              className={`w-full h-14 text-[11px] font-bold uppercase tracking-[3px] transition-all flex items-center justify-center gap-3
                ${hasDeletedItem ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
            >
              {hasDeletedItem ? 'Vui lòng gỡ lỗi' : 'Thanh toán'} <ArrowRight size={14} />
            </button>

            {hasDeletedItem && (
              <p className="text-[9px] text-red-500 font-bold uppercase text-center animate-pulse">
                Bạn có sản phẩm không hợp lệ trong giỏ hàng!
              </p>
            )}

            <div className="space-y-4 pt-4 text-[9px] text-gray-400 font-medium uppercase tracking-tight text-center leading-loose">
              <p>Hỗ trợ đổi trả trong vòng 30 ngày</p>
              <p>Miễn phí vận chuyển cho đơn hàng từ 0đ</p>
              <p>Thanh toán bảo mật tuyệt đối</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};