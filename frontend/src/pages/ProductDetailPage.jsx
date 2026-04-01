import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext'; // 🚀 Import Wishlist
import { ShoppingBag, Star, Heart, Share2, Ruler } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchCartCount } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist(); // 🚀 Hook Wishlist
  const BASE_URL = "http://localhost:5000";

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('detail');

  const isFavorite = isInWishlist(id);

  useEffect(() => {
    fetchProductDetail();
    window.scrollTo(0, 0); // Luôn cuộn lên đầu khi vào trang chi tiết
  }, [id]);

  const fetchProductDetail = async () => {
    try {
      const res = await axiosInstance.get(`/products/${id}`);
      if (res.data.success) {
        setProduct(res.data.data);
        setActiveImage(res.data.data.mainImage);
      }
    } catch (error) {
      toast.error("Không tìm thấy sản phẩm!");
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const galleryImages = product ? Array.from(new Set([product.mainImage, ...(product.images || [])])) : [];

  const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor) return toast.error("Vui lòng chọn Size và Màu sắc!");
    try {
      setAddingToCart(true);
      const res = await axiosInstance.post('/carts/add', {
        productId: id, quantity, size: selectedSize, color: selectedColor
      });
      if (res.data.success) {
        toast.success(`Đã thêm vào giỏ hàng!`);
        fetchCartCount(); 
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi thêm vào giỏ");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-[11px] font-bold tracking-[4px] text-zinc-300 uppercase animate-pulse">Đang tải dữ liệu...</div>;
  if (!product) return null;

  return (
    <div className="bg-white min-h-screen pb-20 pt-24">
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* BREADCRUMBS - Làm nhỏ lại cho tinh tế */}
        <nav className="flex items-center gap-2 text-[9px] font-bold text-zinc-400 uppercase tracking-[3px] mb-12">
          <Link to="/" className="hover:text-black transition">Trang chủ</Link>
          <span className="text-zinc-200">/</span>
          <Link to="/products" className="hover:text-black transition">{product.category?.name || 'Shop'}</Link>
          <span className="text-zinc-200">/</span>
          <span className="text-black">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* GALLERY ẢNH - Thêm hiệu ứng hover zoom */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative overflow-hidden bg-zinc-50 aspect-[3/4] group">
              <img 
                src={`${BASE_URL}${activeImage}`} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                alt={product.name}
              />
              {/* Badge giảm giá */}
              <div className="absolute top-6 left-6 bg-black text-white text-[9px] font-black px-3 py-1.5 uppercase tracking-tighter">
                Sale 50%
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {galleryImages.map((img, index) => (
                <div 
                  key={index}
                  onClick={() => setActiveImage(img)}
                  className={`cursor-pointer aspect-[3/4] overflow-hidden transition-all ${activeImage === img ? 'opacity-100 ring-1 ring-black' : 'opacity-40 hover:opacity-100'}`}
                >
                  <img src={`${BASE_URL}${img}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* THÔNG TIN SẢN PHẨM */}
          <div className="lg:col-span-5 space-y-10 lg:sticky lg:top-32 h-fit">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[4px]">{product.brand || 'ESSENTIAL'}</p>
                <div className="flex gap-4">
                  <button className="text-zinc-300 hover:text-black transition"><Share2 size={16}/></button>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-black tracking-tighter leading-tight">{product.name}</h1>
              
              <div className="flex items-baseline gap-4 pt-2">
                <span className="text-2xl font-black text-black">{product.price.toLocaleString('vi-VN')} Đ</span>
                <span className="text-sm text-zinc-300 line-through">{(product.price * 2).toLocaleString('vi-VN')} Đ</span>
              </div>

              <div className="flex items-center gap-3 pt-4 border-b border-zinc-100 pb-6">
                <div className="flex text-black gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} size={10} fill="currentColor" />)}
                </div>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">(48 đánh giá)</span>
              </div>
            </div>

            {/* Chọn Màu sắc */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-black uppercase tracking-[3px]">Màu sắc: <span className="font-light text-zinc-400">{selectedColor}</span></h3>
              <div className="flex flex-wrap gap-3">
                {product.colors.map(color => (
                  <button 
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest border transition-all ${selectedColor === color ? 'bg-black text-white border-black' : 'bg-white text-zinc-400 border-zinc-100 hover:border-black hover:text-black'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Chọn Kích cỡ */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold text-black uppercase tracking-[3px]">Kích cỡ: <span className="font-light text-zinc-400">{selectedSize}</span></h3>
                <button className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 uppercase tracking-widest hover:text-black transition">
                  <Ruler size={12}/> Hướng dẫn chọn size
                </button>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {product.sizes.map(size => (
                  <button 
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-12 text-[11px] font-bold border transition-all ${selectedSize === size ? 'bg-zinc-100 text-black border-black shadow-inner' : 'bg-white text-zinc-400 border-zinc-100 hover:border-black hover:text-black'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* NÚT BẤM CHÍNH - To, Rõ, Sang */}
            <div className="flex gap-3 pt-6">
              <button 
                onClick={handleAddToCart}
                disabled={product.stock === 0 || addingToCart}
                className="flex-grow h-16 bg-black text-white font-bold text-[11px] uppercase tracking-[4px] hover:bg-zinc-800 transition-all flex items-center justify-center gap-4 disabled:bg-zinc-200"
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                {addingToCart ? 'ĐANG XỬ LÝ...' : (product.stock > 0 ? 'Thêm vào giỏ hàng' : 'Đã hết hàng')}
              </button>
              
              {/* 🚀 NÚT YÊU THÍCH - Đồng bộ tim đỏ */}
              <button 
                onClick={() => toggleWishlist(product)}
                className={`w-16 h-16 border flex items-center justify-center transition-all duration-500 ${
                  isFavorite ? 'border-red-50 bg-red-50 text-red-500 shadow-sm' : 'border-zinc-100 text-zinc-400 hover:text-black hover:border-black'
                }`}
              >
                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} strokeWidth={1.5} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 py-8 border-t border-zinc-100">
              <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-[2px]">Giao hàng hỏa tốc: 2-3 ngày</div>
              <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-[2px]">Đổi trả dễ dàng: 30 ngày</div>
            </div>
          </div>
        </div>

        {/* 🚀 HỆ THỐNG TABS - UI tinh tế hơn */}
        <div className="mt-32">
          <div className="flex justify-center border-b border-zinc-100">
            {['detail', 'policy', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-12 py-8 text-[11px] font-bold uppercase tracking-[4px] transition-all relative ${
                  activeTab === tab ? 'text-black' : 'text-zinc-300 hover:text-zinc-500'
                }`}
              >
                {tab === 'detail' ? 'Mô tả chi tiết' : tab === 'policy' ? 'Chính sách dịch vụ' : 'Đánh giá khách hàng'}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black animate-in fade-in slide-in-from-left-4" />}
              </button>
            ))}
          </div>

          <div className="py-20 max-w-3xl mx-auto animate-in fade-in duration-700">
            {activeTab === 'detail' && (
              <div className="text-[13px] leading-10 text-zinc-600 font-medium tracking-wide">
                {product.description.split('\n').map((line, i) => (
                  <p key={i} className="flex gap-4 items-start mb-4">
                    <span className="mt-4 w-1.5 h-[1px] bg-black shrink-0"></span>
                    {line}
                  </p>
                ))}
              </div>
            )}
            {activeTab === 'policy' && (
              <div className="text-[12px] leading-10 text-zinc-500 uppercase tracking-widest space-y-4">
                <p>• Miễn phí vận chuyển cho đơn hàng từ 1.000.000đ.</p>
                <p>• Hỗ trợ đổi size trong vòng 7 ngày kể từ lúc nhận hàng.</p>
                <p>• Hoàn tiền 100% nếu phát hiện hàng lỗi từ nhà sản xuất.</p>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="text-center py-20 space-y-6">
                <div className="text-zinc-200"><Star size={48} strokeWidth={0.5} className="mx-auto" /></div>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[4px]">Sản phẩm này hiện chưa có phản hồi.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};