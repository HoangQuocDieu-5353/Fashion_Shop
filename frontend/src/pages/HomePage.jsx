import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axiosInstance from '../api/axiosInstance';
import { ShoppingBag, Truck, ShieldCheck, Headphones } from 'lucide-react';

export const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeNewCat, setActiveNewCat] = useState('all');
  const [activeBestCat, setActiveBestCat] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);

  const BASE_URL = "http://localhost:5000";

  // HELPER XỬ LÝ ẢNH CHUẨN
  const getImgUrl = (imageSource) => {
    if (!imageSource) return 'https://placehold.co/800x800?text=No+Image';
    const path = typeof imageSource === 'string' ? imageSource : (imageSource.imageUrl || imageSource.images?.[0]);
    if (path?.startsWith('http')) return path;
    return `${BASE_URL}${path?.startsWith('/') ? '' : '/'}${path}`;
  };

  // 🚀 FIX LỖI GIÁ 0 Đ: Ép kiểu dữ liệu về Number an toàn
  const getMinPrice = (product) => {
    let basePrice = Number(product?.price) || 0; // Ép kiểu nếu DB lưu là String
    
    if (product?.variants?.length > 0) {
      const prices = product.variants.map(v => Number(v.price)).filter(p => !isNaN(p) && p > 0);
      if (prices.length > 0) return Math.min(...prices);
    }
    return basePrice;
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
    fetchInitialData();
  }, [isAuthenticated, user, authLoading, navigate]);

  useEffect(() => {
    if (banners.length > 1) {
      const slideInterval = setInterval(() => {
        setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
      }, 5000);
      return () => clearInterval(slideInterval);
    }
  }, [banners]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, banRes] = await Promise.all([
        axiosInstance.get('/products'),
        axiosInstance.get('/categories'),
        axiosInstance.get('/banners').catch(() => ({ data: { data: [] } })) // Tránh crash nếu chưa có API banner
      ]);
      if (prodRes.data?.success) setProducts(prodRes.data.data);
      if (catRes.data?.success) setCategories(catRes.data.data);
      if (banRes?.data?.success) setBanners(banRes.data.data);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 FIX LỖI HIỂN THỊ SẢN PHẨM: Tăng limit lên 8 hoặc 12 sản phẩm thay vì 4
  const filterProducts = (catId, type) => {
    let filtered = products.filter(p => {
      if (catId === 'all') return true;
      return (p.category?._id || p.category) === catId;
    });
    
    // Trả về tối đa 8 sản phẩm cho 1 section (2 hàng)
    if (type === 'new') return filtered.slice(0, 8);
    // Best seller lấy 8 sản phẩm tiếp theo, nếu ít quá thì lấy lại từ đầu
    return filtered.length > 8 ? filtered.slice(8, 16) : filtered.slice(0, 8); 
  };

  const ProductCard = ({ product }) => {
    const minPrice = getMinPrice(product);

    return (
      <div className="group flex flex-col space-y-4">
        {/* 🚀 FIX UI ẢNH: Chuyển từ aspect-[3/4] sang aspect-square, thêm p-4, đổi object-contain */}
        <div className="relative aspect-square overflow-hidden bg-white border border-zinc-100 rounded-2xl p-4 flex items-center justify-center">
          <Link to={`/products/${product._id}`} className="w-full h-full flex items-center justify-center">
            <img 
              src={getImgUrl(product)} 
              className="max-w-full max-h-full object-contain transition-all duration-700 group-hover:scale-110"
              alt={product.name}
            />
          </Link>
          <button 
            className="absolute bottom-4 right-4 bg-black text-white p-3.5 rounded-full shadow-lg translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-zinc-800"
            title="Thêm vào giỏ"
          >
             <ShoppingBag size={18} />
          </button>
        </div>
        <div className="space-y-1.5 px-1 text-center md:text-left">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">
            {product.category?.name || 'Linh kiện'}
          </p>
          <Link to={`/products/${product._id}`}>
            <h3 className="text-sm font-semibold text-black uppercase tracking-tight truncate hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          {/* Đổi màu giá tiền cho nổi bật hơn (Đỏ/Đen tùy form đồ công nghệ) */}
          <p className="text-sm font-black text-red-600">
            {minPrice.toLocaleString('vi-VN')} đ
          </p>
        </div>
      </div>
    );
  };

  const CategoryTab = ({ active, onChange }) => (
    <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-12">
      <button 
        onClick={() => onChange('all')} 
        className={`text-[11px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all duration-300 ${active === 'all' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-black'}`}
      >
        TẤT CẢ
      </button>
      {categories.map(cat => (
        <button 
          key={cat._id} 
          onClick={() => onChange(cat._id)} 
          className={`text-[11px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all duration-300 ${active === cat._id ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-black'}`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-zinc-200 border-t-black rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      
      {/* 1. HERO SLIDER */}
      <section className="relative h-[60vh] md:h-[80vh] w-full overflow-hidden bg-zinc-900">
        {banners.length > 0 ? (
          <>
            {banners.map((b, index) => (
              <div 
                key={b._id} 
                className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
              >
                <img src={getImgUrl(b.imageUrl)} className="w-full h-full object-cover opacity-70" alt={b.title} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter mb-6 drop-shadow-2xl">
                    {b.title}
                  </h2>
                  <Link to={b.linkUrl || '/products'} className="bg-blue-600 text-white px-10 py-4 text-[11px] font-black uppercase tracking-[3px] hover:bg-blue-700 transition-colors duration-300 shadow-xl rounded-sm">
                    Khám phá ngay
                  </Link>
                </div>
              </div>
            ))}
            
            {banners.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                {banners.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 transition-all duration-300 rounded-full ${idx === currentSlide ? 'w-8 bg-blue-500' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-zinc-800 text-zinc-400 font-bold uppercase tracking-[5px]">
            VST COMPUTER BANNER
          </div>
        )}
      </section>

      {/* 2. NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto pt-24 px-4 sm:px-6">
        <div className="flex flex-col items-center text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[2px] text-black border-b-4 border-blue-600 pb-2">
            Sản phẩm mới
          </h2>
        </div>
        
        <CategoryTab active={activeNewCat} onChange={setActiveNewCat} />
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {filterProducts(activeNewCat, 'new').map(p => <ProductCard key={p._id} product={p} />)}
        </div>
        {filterProducts(activeNewCat, 'new').length === 0 && (
           <p className="text-center text-zinc-400 text-sm py-10">Chưa có sản phẩm nào trong danh mục này.</p>
        )}
      </section>

      {/* 3. BEST SELLERS */}
      <section className="max-w-7xl mx-auto pt-24 px-4 sm:px-6">
        <div className="flex flex-col items-center text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[2px] text-black border-b-4 border-blue-600 pb-2">
            Bán chạy nhất
          </h2>
        </div>

        <CategoryTab active={activeBestCat} onChange={setActiveBestCat} />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {filterProducts(activeBestCat, 'best').map(p => <ProductCard key={p._id} product={p} />)}
        </div>
        {filterProducts(activeBestCat, 'best').length === 0 && (
           <p className="text-center text-zinc-400 text-sm py-10">Chưa có sản phẩm nào trong danh mục này.</p>
        )}
      </section>

      {/* 4. SERVICES */}
      <section className="max-w-6xl mx-auto mt-24 pt-12 border-t border-zinc-100 px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="flex flex-col items-center text-center space-y-4 group">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full group-hover:-translate-y-2 transition-transform duration-300">
            <Truck size={28} strokeWidth={1.5} />
          </div>
          <h3 className="text-[12px] font-black uppercase tracking-[1px]">Giao hàng hỏa tốc</h3>
          <p className="text-[11px] text-zinc-500">Miễn phí cho đơn từ 1.000.000đ</p>
        </div>
        
        <div className="flex flex-col items-center text-center space-y-4 group">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full group-hover:-translate-y-2 transition-transform duration-300">
            <ShieldCheck size={28} strokeWidth={1.5} />
          </div>
          <h3 className="text-[12px] font-black uppercase tracking-[1px]">Bảo hành chính hãng</h3>
          <p className="text-[11px] text-zinc-500">Cam kết 100% chất lượng từ VST</p>
        </div>
        
        <div className="flex flex-col items-center text-center space-y-4 group">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full group-hover:-translate-y-2 transition-transform duration-300">
            <Headphones size={28} strokeWidth={1.5} />
          </div>
          <h3 className="text-[12px] font-black uppercase tracking-[1px]">Hỗ trợ kỹ thuật</h3>
          <p className="text-[11px] text-zinc-500">Phục vụ 24/7 qua Hotline/Zalo</p>
        </div>
      </section>

    </div>
  );
};