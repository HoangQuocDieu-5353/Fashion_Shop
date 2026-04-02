import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { ShoppingBag, Star, ChevronLeft, ChevronRight, SearchX, ShoppingBasket, Filter, SortDesc, Zap } from 'lucide-react';

export const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get('search') || ''; 
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const BASE_URL = "http://localhost:5000";

  // 🚀 Helper xử lý URL ảnh (đồng bộ với trang Detail)
  const getImgUrl = (product) => {
  // 1. Kiểm tra xem có mảng images và có phần tử nào không
  const imagePath = (product?.images && product.images.length > 0) 
    ? product.images[0] 
    : null;

  if (!imagePath) return 'https://placehold.co/400x500?text=No+Image'; // Dùng placehold.co ổn định hơn
  
  // 2. Xử lý nếu là ảnh Base64 hoặc Blob
  if (imagePath.startsWith('data:') || imagePath.startsWith('blob:')) return imagePath;

  // 3. Xử lý đường dẫn từ Server
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${BASE_URL}/${cleanPath}`;
};

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get('/categories');
        if (res.data.success) setCategories(res.data.data);
      } catch (error) {
        console.error("Lỗi lấy danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [querySearch, category, sort, page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/products?search=${querySearch}&category=${category}&sort=${sort}&page=${page}&limit=12`);
      if (res.data.success) {
        setProducts(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error("Lỗi lấy sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
      
      {/* 1. THANH LỌC & SẮP XẾP */}
      <div className="flex flex-col md:flex-row gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 items-center justify-between">
        <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">
                {querySearch ? `🔍 Kết quả cho: "${querySearch}"` : "🛍️ Cửa hàng trực tuyến"}
            </h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                Tìm thấy {pagination.totalProducts || 0} sản phẩm chất lượng
            </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100">
            <Filter size={16} className="text-gray-400" />
            <select 
              value={category} 
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="bg-transparent border-none font-black text-gray-700 text-xs uppercase tracking-widest outline-none cursor-pointer"
            >
              <option value="All">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100">
            <SortDesc size={16} className="text-gray-400" />
            <select 
              value={sort} 
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="bg-transparent border-none font-black text-gray-700 text-xs uppercase tracking-widest outline-none cursor-pointer"
            >
              <option value="">Mới nhất</option>
              <option value="price-low">Giá: Thấp - Cao</option>
              <option value="price-high">Giá: Cao - Thấp</option>
              <option value="az">Tên: A - Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. DANH SÁCH SẢN PHẨM */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-[40px]"></div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {products.map((product) => {
            // 🚀 Logic kiểm tra giá biến thể
            const hasVariantPrices = product.variants?.some(v => v.price && v.price !== product.price);
            const minVariantPrice = product.variants?.length > 0 
                ? Math.min(...product.variants.map(v => v.price || product.price)) 
                : product.price;
            
            // 🚀 Logic kiểm tra tổng kho
            const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0);
            const isOutOfStock = totalStock === 0;

            return (
              <div key={product._id} className="group flex flex-col relative">
                <Link to={`/products/${product._id}`} className="relative aspect-[3/4] rounded-[40px] overflow-hidden bg-gray-50 border border-gray-100 shadow-sm transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
                  <img 
                    src={getImgUrl(product)} 
                    className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-60' : ''}`} 
                    alt={product.name}
                  />
                  
                  {/* Badge Hết hàng */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                        <span className="bg-white text-black px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">
                            Hết hàng
                        </span>
                    </div>
                  )}

                  {/* Badge New/Hot */}
                  {!isOutOfStock && (
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                         <div className="bg-red-600 text-white p-2 rounded-xl shadow-lg animate-pulse">
                            <Zap size={14} fill="currentColor" />
                         </div>
                    </div>
                  )}

                  <div className="absolute bottom-6 right-6 p-5 bg-white rounded-[20px] shadow-2xl text-gray-900 opacity-0 translate-y-6 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-black hover:text-white">
                    <ShoppingBag size={22} />
                  </div>
                </Link>

                <div className="mt-6 px-2">
                  <div className="flex justify-between items-start gap-4">
                    <Link to={`/products/${product._id}`} className="flex-1">
                        <h3 className="font-black text-gray-900 text-lg uppercase tracking-tighter line-clamp-1 group-hover:text-red-600 transition">
                            {product.name}
                        </h3>
                    </Link>
                    <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={12} fill="currentColor"/>
                        <span className="text-[10px] font-black text-gray-400">4.9</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-red-600 font-black text-2xl">
                        {hasVariantPrices ? `Từ ${minVariantPrice.toLocaleString('vi-VN')}` : product.price.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  
                  {/* Hiển thị tóm tắt biến thể */}
                  <div className="mt-3 flex gap-1.5">
                     {[...new Set(product.variants?.map(v => v.color))].slice(0, 3).map((color, i) => (
                        <div key={i} className="w-3 h-3 rounded-full border border-gray-200 bg-gray-100" title={color}></div>
                     ))}
                     {product.variants?.length > 3 && <span className="text-[9px] font-black text-gray-300">+{product.variants.length - 3}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 3. EMPTY STATE */
        <div className="py-32 flex flex-col items-center text-center space-y-8 bg-gray-50 rounded-[60px] border-4 border-dashed border-gray-100">
          <div className="relative">
             <div className="w-32 h-32 bg-white rounded-[40px] shadow-xl flex items-center justify-center">
                <ShoppingBasket size={60} className="text-gray-200" />
             </div>
             <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <SearchX size={24} />
             </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Không tìm thấy món đồ này!</h3>
            <p className="text-gray-400 font-bold max-w-sm mx-auto uppercase text-[10px] tracking-[0.2em] leading-relaxed">
                Chúng tôi không có kết quả cho <span className="text-red-600">"{querySearch}"</span>. 
                Thử đổi từ khóa hoặc xem các danh mục khác nhé.
            </p>
          </div>
          <button 
            onClick={() => window.location.href='/products'}
            className="bg-gray-900 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-600 transition shadow-2xl"
          >
            Xem tất cả sản phẩm
          </button>
        </div>
      )}

      {/* 4. PHÂN TRANG */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-10">
          <button 
            disabled={page === 1}
            onClick={() => { setPage(prev => prev - 1); window.scrollTo(0,0); }}
            className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:bg-black hover:text-white transition disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-2">
             {[...Array(pagination.totalPages)].map((_, i) => (
                <button 
                    key={i}
                    onClick={() => { setPage(i + 1); window.scrollTo(0,0); }}
                    className={`w-12 h-12 rounded-2xl font-black transition-all ${page === i + 1 ? 'bg-red-600 text-white shadow-lg scale-110' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                >
                    {i + 1}
                </button>
             ))}
          </div>
          <button 
            disabled={page === pagination.totalPages}
            onClick={() => { setPage(prev => prev + 1); window.scrollTo(0,0); }}
            className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:bg-black hover:text-white transition disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};