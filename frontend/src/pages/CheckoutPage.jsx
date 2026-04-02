import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { ChevronLeft, Truck, CreditCard, Shield, Package, Ticket, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchCartCount } = useCart();
  
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const BASE_URL = "http://localhost:5000";

  const [formData, setFormData] = useState({
    shippingAddress: user?.address || '', // 🚀 Lấy address mặc định nếu user có
    phone: user?.phone || '',
    paymentMethod: 'COD'
  });

  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  // 🚀 TỐI ƯU HÀM LẤY ẢNH: Phù hợp với mảng images của Product
  const getImgUrl = (item) => {
    const imagePath = item.variant?.image || (item.product?.images && item.product.images[0]);
    if (!imagePath) return 'https://placehold.co/400x500?text=No+Image';
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${BASE_URL}/${cleanPath}`;
  };

  useEffect(() => {
    fetchCartData();
    fetchAvailableCoupons();
  }, []);

  const fetchCartData = async () => {
    try {
      const res = await axiosInstance.get('/carts');
      if (res.data.success && res.data.data.items.length > 0) {
        setCart(res.data.data);
      } else {
        toast.error("Giỏ hàng trống!");
        navigate('/products');
      }
    } catch (error) {
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCoupons = async () => {
    try {
      const res = await axiosInstance.get('/coupons/available');
      if (res.data.success) setAvailableCoupons(res.data.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách coupon");
    }
  };

  // 🚀 TÍNH TOÁN TIỀN BẠC (Logic đồng bộ với Backend)
  const subTotal = cart?.items?.reduce((sum, item) => {
    const price = item.variant?.price || item.product?.price || 0;
    return sum + (price * item.quantity);
  }, 0) || 0;

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalAmount = Math.max(0, subTotal - discountAmount); 

  const handleApplyCoupon = async (e, directCode = null) => {
    if (e) e.preventDefault();
    const targetCode = directCode || couponCode;
    
    if (!targetCode.trim()) return toast.error("Vui lòng nhập mã!");

    try {
      setIsApplying(true);
      const res = await axiosInstance.post('/coupons/apply', {
        code: targetCode,
        orderValue: subTotal
      });

      if (res.data.success) {
        toast.success("Áp dụng mã thành công!");
        setAppliedCoupon(res.data.data);
        setCouponCode(''); // Xóa ô nhập sau khi áp dụng thành công
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Mã không khả dụng");
    } finally {
      setIsApplying(false);
    }
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!formData.shippingAddress || !formData.phone) {
      return toast.error("Điền đầy đủ thông tin giao hàng!");
    }
    try {
      setOrdering(true);
      const res = await axiosInstance.post('/orders/create', {
        ...formData,
        couponId: appliedCoupon ? appliedCoupon.couponId : null
      });
      
      if (res.data.success) {
        toast.success("Đặt hàng thành công!");
        fetchCartCount(); 
        navigate('/orders');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi đặt hàng");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-[10px] font-bold tracking-[4px] uppercase text-zinc-400 animate-pulse">Đang tải thông tin...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <nav className="flex items-center gap-2 text-[10px] text-zinc-400 uppercase tracking-[3px] mb-12">
        <Link to="/cart" className="hover:text-black flex items-center gap-1 transition-all font-bold">
          <ChevronLeft size={12} /> Quay lại
        </Link>
        <span className="text-zinc-200">/</span>
        <span className="text-black font-black">Thanh toán</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* FORM THÔNG TIN (Bên trái) */}
        <div className="lg:col-span-7 space-y-12">
          <section className="space-y-8">
            <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Truck size={20} /> 01. Vận chuyển
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[2px]">Địa chỉ giao hàng</label>
                <input 
                  type="text"
                  className="w-full border-b border-zinc-200 py-3 focus:border-black outline-none transition-all text-sm font-medium bg-transparent"
                  value={formData.shippingAddress}
                  onChange={(e) => setFormData({...formData, shippingAddress: e.target.value})}
                  placeholder="Số nhà, tên đường, phường/xã..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[2px]">Số điện thoại</label>
                <input 
                  type="text"
                  className="w-full border-b border-zinc-200 py-3 focus:border-black outline-none transition-all text-sm font-black tracking-widest bg-transparent"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
              <CreditCard size={20} /> 02. Thanh toán
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {['COD', 'Card'].map((method) => (
                <button 
                  key={method}
                  onClick={() => setFormData({...formData, paymentMethod: method})}
                  className={`p-5 border flex items-center justify-between transition-all rounded-xl ${formData.paymentMethod === method ? 'border-black bg-zinc-50' : 'border-zinc-100 text-zinc-400'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">{method === 'COD' ? 'Tiền mặt' : 'Thẻ/Chuyển khoản'}</span>
                  {formData.paymentMethod === method && <CheckCircle2 size={14} className="text-black" />}
                </button>
              ))}
            </div>
          </section>

          <button 
            onClick={handleOrder}
            disabled={ordering}
            className="w-full bg-black text-white h-16 text-[11px] font-black uppercase tracking-[4px] hover:bg-zinc-800 transition-all rounded-xl shadow-xl disabled:opacity-50"
          >
            {ordering ? 'ĐANG XỬ LÝ...' : `HOÀN TẤT ĐẶT HÀNG - ${finalAmount.toLocaleString()}đ`}
          </button>
        </div>

        {/* TÓM TẮT & COUPON (Bên phải) */}
        <div className="lg:col-span-5">
          <div className="bg-zinc-50 p-8 rounded-[32px] border border-zinc-100 sticky top-32 space-y-8">
            <h3 className="text-[11px] font-black uppercase tracking-[3px] border-b border-zinc-200 pb-4">Tóm tắt đơn hàng</h3>
            
            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
              {cart?.items.map((item) => (
                <div key={item._id} className="flex gap-4 items-center">
                  <div className="w-12 h-16 bg-white border rounded-lg overflow-hidden shrink-0">
                    <img src={getImgUrl(item)} className="w-full h-full object-cover" alt="p" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] font-black uppercase truncate">{item.product?.name}</h4>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase">{item.color} / {item.size} x {item.quantity}</p>
                  </div>
                  <span className="text-xs font-black">
                    {((item.variant?.price || item.product?.price || 0) * item.quantity).toLocaleString()}đ
                  </span>
                </div>
              ))}
            </div>

            {/* PHẦN COUPON - ĐÃ TỐI ƯU */}
            <div className="pt-6 border-t border-zinc-200 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest flex items-center justify-between">
                <span>Ưu đãi hiện có</span>
                <Ticket size={14} />
              </p>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-white border-2 border-black p-4 rounded-xl">
                  <div>
                    <p className="text-[10px] font-black uppercase">{appliedCoupon.code}</p>
                    <p className="text-[9px] text-green-600 font-bold">- {appliedCoupon.discountAmount.toLocaleString()}đ</p>
                  </div>
                  <button onClick={() => setAppliedCoupon(null)} className="text-[9px] font-bold uppercase text-zinc-400 hover:text-red-500">Gỡ</button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {availableCoupons.map((cp) => {
                    const isEligible = subTotal >= cp.minOrderValue;
                    return (
                      <button
                        key={cp._id}
                        disabled={!isEligible || isApplying}
                        onClick={() => handleApplyCoupon(null, cp.code)}
                        className={`text-left p-3 border rounded-xl transition-all ${isEligible ? 'bg-white border-zinc-200 hover:border-black' : 'opacity-50 bg-zinc-100 cursor-not-allowed'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase">{cp.code}</span>
                          {!isEligible && <span className="text-[8px] font-bold text-red-500 flex items-center gap-1"><AlertCircle size={10}/> Thiếu {(cp.minOrderValue - subTotal).toLocaleString()}đ</span>}
                        </div>
                        <p className="text-[9px] text-zinc-400 font-medium">Giảm {cp.discountType === 'percent' ? `${cp.discountValue}%` : `${cp.discountValue.toLocaleString()}đ`}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2 text-[11px] font-bold uppercase tracking-widest pt-4">
              <div className="flex justify-between text-zinc-400">
                <span>Tạm tính</span>
                <span>{subTotal.toLocaleString()}đ</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>- {appliedCoupon.discountAmount.toLocaleString()}đ</span>
                </div>
              )}
              <div className="flex justify-between text-black text-lg font-black pt-4 border-t border-black">
                <span>Tổng tiền</span>
                <span>{finalAmount.toLocaleString()}đ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};