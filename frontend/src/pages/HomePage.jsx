import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axiosInstance from '../api/axiosInstance';
import { ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, Zap, Star, Truck, ShieldCheck, Headphones } from 'lucide-react';

export const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]); // 🚀 STATE MỚI CHO BANNER
  const [loading, setLoading] = useState(true);
  
  const [activeNewCat, setActiveNewCat] = useState('all');
  const [activeBestCat, setActiveBestCat] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);

  const BASE_URL = "http://localhost:5000";

  // 🚀 HELPER XỬ LÝ ẢNH CHUẨN
  const getImgUrl = (imageSource) => {
    if (!imageSource) return 'https://placehold.co/1200x600?text=No+Image';
    const path = typeof imageSource === 'string' ? imageSource : (imageSource.imageUrl || imageSource.images?.[0]);
    if (path?.startsWith('http')) return path;
    return `${BASE_URL}${path?.startsWith('/') ? '' : '/'}${path}`;
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
    fetchInitialData();
  }, [isAuthenticated, user, authLoading, navigate]);

  // Tự động chuyển slide
  useEffect(() => {
    if (banners.length > 0) {
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
        axiosInstance.get('/banners') // 🚀 GỌI API BANNER MODEL 13
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
      if (banRes.data.success) setBanners(banRes.data.data);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = (catId, type) => {
    let filtered = products.filter(p => {
      if (catId === 'all') return true;
      return (p.category?._id || p.category) === catId;
    });
    return type === 'new' ? filtered.slice(0, 4) : filtered.slice(4, 8);
  };

  const ProductCard = ({ product }) => {
    const minPrice = product.variants?.length > 0 
      ? Math.min(...product.variants.map(v => v.price)) 
      : product.price;

    return (
      <div className="group space-y-4">
        <div className="relative aspect-[3/4] overflow-hidden bg-zinc-50 border border-zinc-100 rounded-2xl">
          <Link to={`/products/${product._id}`}>
            <img 
              src={getImgUrl(product)} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt={product.name}
            />
          </Link>
          <button className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black hover:text-white">
             <ShoppingBag size={18} />
          </button>
        </div>
        <div className="space-y-1 px-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{product.category?.name}</p>
          <Link to={`/products/${product._id}`}>
            <h3 className="text-sm font-bold text-black uppercase tracking-tight truncate hover:underline">{product.name}</h3>
          </Link>
          <p className="text-sm font-black">{minPrice.toLocaleString('vi-VN')} đ</p>
        </div>
      </div>
    );
  };

  const CategoryTab = ({ active, onChange }) => (
    <div className="flex justify-center gap-8 mb-12">
      <button onClick={() => onChange('all')} className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${active === 'all' ? 'border-black text-black' : 'border-transparent text-zinc-300'}`}>Tất cả</button>
      {categories.map(cat => (
        <button key={cat._id} onClick={() => onChange(cat._id)} className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${active === cat._id ? 'border-black text-black' : 'border-transparent text-zinc-300'}`}>{cat.name}</button>
      ))}
    </div>
  );

  return (
    <div className="bg-white">
      
      {/* 1. HERO SLIDER (DÙNG DỮ LIỆU TỪ DATABASE) */}
      <section className="relative h-[85vh] w-full overflow-hidden">
        {banners.length > 0 ? banners.map((b, index) => (
          <div key={b._id} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
            <img src={getImgUrl(b.imageUrl)} className="w-full h-full object-cover" alt={b.title} />
            <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center text-center px-6">
              <h2 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter mb-8 drop-shadow-lg">{b.title}</h2>
              <Link to={b.linkUrl} className="bg-white text-black px-12 py-4 text-[11px] font-black uppercase tracking-[3px] hover:bg-black hover:text-white transition-all shadow-xl">
                Khám phá ngay
              </Link>
            </div>
          </div>
        )) : (
            <div className="h-full w-full bg-zinc-100 animate-pulse flex items-center justify-center text-zinc-300 font-bold uppercase tracking-[5px]">Fashion Shop</div>
        )}
      </section>

      {/* 2. NEW ARRIVALS (Tối giản hoàn toàn) */}
      <section className="max-w-7xl mx-auto py-24 px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-zinc-300 font-black text-[50px] uppercase opacity-20 mb-[-35px]">Modern</span>
          <h2 className="text-2xl font-black uppercase tracking-[5px] text-black relative z-10">New Arrivals</h2>
        </div>
        <CategoryTab active={activeNewCat} onChange={setActiveNewCat} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {filterProducts(activeNewCat, 'new').map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      </section>

      {/* 3. BEST SELLERS (Bỏ nền đen, dùng viền mảnh sang trọng) */}
      <section className="border-t border-b border-zinc-100 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-16 border-l-4 border-black pl-6">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-[5px]">Best Sellers</h2>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-2">Những món đồ được yêu thích nhất mùa này</p>
            </div>
            <Link to="/products" className="text-[10px] font-black uppercase tracking-widest border-b border-black pb-1 hover:text-zinc-400 hover:border-zinc-400 transition-all">Xem tất cả</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {filterProducts(activeBestCat, 'best').map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      </section>

      {/* 4. SERVICES (Minimalist Icons) */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="flex flex-col items-center text-center space-y-4">
            <Truck size={32} strokeWidth={1} />
            <h3 className="text-[11px] font-black uppercase tracking-[3px]">Giao hàng hỏa tốc</h3>
            <p className="text-[10px] text-zinc-400 uppercase leading-loose">Miễn phí cho đơn từ 1.000.000đ</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4 border-x border-zinc-100">
            <ShieldCheck size={32} strokeWidth={1} />
            <h3 className="text-[11px] font-black uppercase tracking-[3px]">Bảo hành 12 tháng</h3>
            <p className="text-[10px] text-zinc-400 uppercase leading-loose">Cam kết chất lượng vải cao cấp</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <Headphones size={32} strokeWidth={1} />
            <h3 className="text-[11px] font-black uppercase tracking-[3px]">Hỗ trợ tận tâm</h3>
            <p className="text-[10px] text-zinc-400 uppercase leading-loose">Phục vụ 24/7 qua Hotline/Zalo</p>
          </div>
        </div>
      </section>

    </div>
  );
};