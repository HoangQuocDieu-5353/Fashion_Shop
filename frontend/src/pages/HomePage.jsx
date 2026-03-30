import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axiosInstance from '../api/axiosInstance';
import { ShoppingBag, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

export const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States cho bộ lọc
  const [activeNewCat, setActiveNewCat] = useState('all');
  const [activeBestCat, setActiveBestCat] = useState('all');
  
  // States cho Banner tự động chạy
  const [currentSlide, setCurrentSlide] = useState(0);
  const BASE_URL = "http://localhost:5000";

  const banners = [
    { 
      id: 1, 
      title: "ESSENTIAL COLLECTION", 
      desc: "Sự tinh tế trong từng đường nét tối giản.", 
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop", // Ảnh mẫu Studio sang trọng
    },
    { 
      id: 2, 
      title: "NEW SEASON 2026", 
      desc: "Khám phá phong cách dẫn đầu xu hướng.", 
      image: "https://images.unsplash.com/photo-1580828343064-fde4fc206bc6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZmFzaGlvbiUyMGJhbm5lcnxlbnwwfHwwfHx8MA%3D%3D", // Ảnh phố xá hiện đại
    },
    { 
      id: 3, 
      title: "PREMIUM TEXTURE", 
      desc: "Chất liệu cao cấp cho trải nghiệm thượng lưu.", 
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop", // Ảnh store/texture cao cấp
    }
  ];

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
    fetchInitialData();

    // Auto-play Banner mỗi 5 giây
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(slideInterval);
  }, [isAuthenticated, user, authLoading, navigate]);

  const fetchInitialData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        axiosInstance.get('/products'),
        axiosInstance.get('/categories')
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper lọc sản phẩm
  const filterProducts = (catId, type) => {
    // 1. Lọc theo danh mục trước
    let filtered = products.filter(p => {
      if (catId === 'all') return true;
      // Kiểm tra cả trường hợp category là Object hoặc chỉ là ID chuỗi
      return p.category?._id === catId || p.category === catId;
    });

    // 2. Logic phân loại
    if (type === 'new') {
      // Lấy 4 sản phẩm đầu tiên của danh mục đó
      return filtered.slice(0, 4);
    } else {
      // Lấy 4 sản phẩm nhưng đảo ngược lại (giả lập bán chạy)
      // Hoặc nếu ông giáo có trường 'sold', hãy dùng: .sort((a,b) => b.sold - a.sold)
      return [...filtered].reverse().slice(0, 4);
    }
  };

  const ProductCard = ({ product }) => (
    <div className="group space-y-4">
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
        <img 
          src={product.mainImage ? `${BASE_URL}${product.mainImage}` : 'https://via.placeholder.com/400x500'} 
          alt={product.name}
          className="w-full h-full object-cover grayscale-[0.2] transition-transform duration-700 group-hover:scale-105 group-hover:grayscale-0"
        />
        <button className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
           <div className="bg-white text-black p-3 rounded-full translate-y-4 group-hover:translate-y-0 transition-transform">
             <ShoppingBag size={20} />
           </div>
        </button>
      </div>
      <div className="space-y-1 text-center">
        <h3 className="text-[11px] font-bold uppercase tracking-[2px] text-gray-400">{product.category?.name}</h3>
        <Link to={`/products/${product._id}`}>
          <p className="text-[13px] font-medium text-black hover:underline underline-offset-4">{product.name}</p>
        </Link>
        <p className="text-[12px] font-bold tracking-tighter">{product.price.toLocaleString('vi-VN')} VND</p>
      </div>
    </div>
  );

  const CategoryFilter = ({ active, onChange }) => (
    <div className="flex justify-center gap-8 mb-12">
      <button 
        onClick={() => onChange('all')}
        className={`text-[10px] font-bold uppercase tracking-[2px] transition-all pb-1 ${active === 'all' ? 'border-b border-black text-black' : 'text-gray-300'}`}
      >
        Tất cả
      </button>
      {categories.map(cat => (
        <button 
          key={cat._id}
          onClick={() => onChange(cat._id)}
          className={`text-[10px] font-bold uppercase tracking-[2px] transition-all pb-1 ${active === cat._id ? 'border-b border-black text-black' : 'text-gray-300'}`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      
      {/* 1. AUTO-PLAY BANNER - Đã thêm thẻ img và fix overlay */}
      <section className="relative h-[85vh] w-full overflow-hidden bg-zinc-900">
        {banners.map((b, index) => (
          <div 
            key={b.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
            }`}
          >
            {/* 📸 CHÈN ẢNH BANNER VÀO ĐÂY */}
            <img 
              src={b.image} 
              alt={b.title} 
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* 🖤 LỚP PHỦ OVERLAY - Chỉnh opacity thấp xuống (40%-50%) để thấy ảnh */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>

            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 space-y-6">
              <span className="text-[11px] font-bold tracking-[8px] text-zinc-200 uppercase animate-pulse">
                Aesthetic Choice
              </span>
              <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none max-w-5xl italic drop-shadow-2xl">
                {b.title}
              </h2>
              <p className="text-[14px] text-zinc-200 font-medium tracking-[3px] uppercase max-w-xl">
                {b.desc}
              </p>
              <div className="pt-10">
                <Link 
                  to="/products" 
                  // 🚀 CHỖ NÀY: Thêm 'inline-block' để overflow-hidden có tác dụng
                  className="group relative inline-block border border-white text-white px-12 py-5 text-[12px] font-bold uppercase tracking-[4px] overflow-hidden transition-all"
                >
                  <span className="relative z-10 group-hover:text-black transition-colors duration-500">
                    Khám phá bộ sưu tập
                  </span>
                  
                  {/* 💡 Cái div này giờ sẽ bị giấu đi nhờ inline-block + overflow-hidden */}
                  <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Dots - Thanh mảnh hơn */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-6 z-20">
          {banners.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentSlide(i)} 
              className={`h-[2px] transition-all duration-500 ${
                i === currentSlide ? 'w-16 bg-white' : 'w-8 bg-white/30 hover:bg-white/60'
              }`} 
            />
          ))}
        </div>
      </section>

      {/* ==================== 2. SẢN PHẨM MỚI (New Arrivals) ==================== */}
      <section className="max-w-[1200px] mx-auto py-24 px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-[24px] font-bold uppercase tracking-[8px] text-zinc-900">
            🔥 Sản Phẩm Mới
          </h2>
          <div className="w-12 h-[2px] bg-black mx-auto"></div>
        </div>
        
        <CategoryFilter active={activeNewCat} onChange={setActiveNewCat} />

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] bg-gray-50 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 animate-in fade-in duration-700">
            {filterProducts(activeNewCat, 'new').map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </section>

      {/* ==================== 3. SẢN PHẨM BÁN CHẠY (Best Sellers) - CẬP NHẬT: ĐỒNG BỘ UI ==================== */}
      {/* THAY ĐỔI: Bỏ bg-zinc-50, thay bằng container giống Phần 2 */}
      <section className="max-w-[1200px] mx-auto py-24 px-4">
        <div className="max-w-[1200px] mx-auto px-4">
          {/* THAY ĐỔI: Thêm text-center để căn giữa header */}
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-[24px] font-bold uppercase tracking-[8px] text-zinc-900">
              ⭐ Bán Chạy Nhất
            </h2>
            <div className="w-12 h-[2px] bg-black mx-auto"></div>
          </div>

          <CategoryFilter active={activeBestCat} onChange={setActiveBestCat} />

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] bg-gray-50 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 animate-in fade-in duration-700">
              {filterProducts(activeBestCat, 'best').map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* 4. BRAND SERVICES - Vùng đệm tăng độ tin cậy trước khi xuống Footer chung */}
<section className="border-t border-zinc-100 py-32 bg-white">
  <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
    
    {/* Giao hàng */}
    <div className="text-center space-y-4 group">
      <div className="flex justify-center text-black mb-6 transition-transform duration-500 group-hover:-translate-y-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      </div>
      <h3 className="text-[11px] font-bold uppercase tracking-[3px]">Giao hàng toàn quốc</h3>
      <p className="text-[10px] text-zinc-400 uppercase tracking-[2px] leading-relaxed max-w-[250px] mx-auto">
        Miễn phí vận chuyển cho mọi đơn hàng trên 1.000.000đ
      </p>
    </div>

    {/* Bảo mật */}
    <div className="text-center space-y-4 group">
      <div className="flex justify-center text-black mb-6 transition-transform duration-500 group-hover:-translate-y-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      </div>
      <h3 className="text-[11px] font-bold uppercase tracking-[3px]">Thanh toán bảo mật</h3>
      <p className="text-[10px] text-zinc-400 uppercase tracking-[2px] leading-relaxed max-w-[250px] mx-auto">
        Tích hợp các cổng thanh toán an toàn và đa dạng
      </p>
    </div>

    {/* Hỗ trợ */}
    <div className="text-center space-y-4 group">
      <div className="flex justify-center text-black mb-6 transition-transform duration-500 group-hover:-translate-y-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <h3 className="text-[11px] font-bold uppercase tracking-[3px]">Hỗ trợ 24/7</h3>
      <p className="text-[10px] text-zinc-400 uppercase tracking-[2px] leading-relaxed max-w-[250px] mx-auto">
        Đội ngũ CSKH luôn sẵn sàng giải đáp mọi thắc mắc
      </p>
    </div>

  </div>
</section>
    </div>
  );
};