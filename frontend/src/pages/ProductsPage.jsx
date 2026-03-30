import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom'; // 🚀 Lấy search từ URL
import axiosInstance from '../api/axiosInstance';
import { ShoppingBag, Star, ChevronLeft, ChevronRight, SearchX, ShoppingBasket, Filter, SortDesc } from 'lucide-react';

export const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get('search') || ''; // 🚀 Lấy chữ user gõ trên Header
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // 🚀 State cho danh mục từ DB
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const BASE_URL = "http://localhost:5000";

  // 🚀 Lấy danh mục từ Database khi vừa vào trang
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

  // 🚀 Tự động load lại khi từ khóa, danh mục hoặc sắp xếp thay đổi
  useEffect(() => {
    fetchProducts();
  }, [querySearch, category, sort, page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Gửi querySearch lấy từ URL lên Backend
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
      
      {/* 1. THANH LỌC & SẮP XẾP (Đã bỏ Search bar) */}
      <div className="flex flex-col md:flex-row gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 items-center justify-between">
        <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">
                {querySearch ? `🔍 Kết quả cho: "${querySearch}"` : "🛍️ Tất cả sản phẩm"}
            </h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                Tìm thấy {pagination.totalProducts || 0} món đồ xịn
            </p>
        </div>

        <div className="flex flex-wrap gap-4">
          {/* 📂 LỌC DANH MỤC DỰA TRÊN DỮ LIỆU THẬT */}
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

          {/* 📊 SẮP XẾP THEO GIÁ & TÊN */}
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

      {/* 2. HIỂN THỊ SẢN PHẨM HOẶC THÔNG BÁO KHI KHÔNG CÓ HÀNG */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-[40px]"></div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {products.map((product) => (
            <div key={product._id} className="group flex flex-col">
              <div className="relative aspect-[3/4] rounded-[40px] overflow-hidden bg-gray-50 border border-gray-100 shadow-sm transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
                <img 
                  src={product.mainImage ? `${BASE_URL}${product.mainImage}` : 'https://via.placeholder.com/400x500'} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  alt={product.name}
                />
                <button className="absolute bottom-6 right-6 p-5 bg-white rounded-[20px] shadow-2xl text-gray-900 opacity-0 translate-y-6 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-600 hover:text-white">
                  <ShoppingBag size={22} />
                </button>
              </div>
              <div className="mt-6 px-2">
                <Link to={`/products/${product._id}`}>
                  <h3 className="font-black text-gray-900 text-lg uppercase tracking-tighter line-clamp-1 group-hover:text-red-600 transition">{product.name}</h3>
                </Link>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-red-600 font-black text-2xl">{product.price.toLocaleString('vi-VN')} đ</span>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-600 rounded-full text-xs font-black">
                    <Star size={12} fill="currentColor"/> 4.8
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 🚀 3. EMPTY STATE (Khi không có sản phẩm) */
        <div className="py-32 flex flex-col items-center text-center space-y-8 bg-gray-50 rounded-[60px] border-4 border-dashed border-gray-100 animate-in fade-in zoom-in duration-500">
          <div className="relative">
             <div className="w-32 h-32 bg-white rounded-[40px] shadow-xl flex items-center justify-center">
                <ShoppingBasket size={60} className="text-gray-200" />
             </div>
             <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg animate-bounce">
                <SearchX size={24} />
             </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Hết món này rồi ông giáo ơi!</h3>
            <p className="text-gray-400 font-bold max-w-sm mx-auto uppercase text-[10px] tracking-[0.2em] leading-relaxed">
                Chúng tôi không tìm thấy kết quả nào cho <span className="text-red-600">"{querySearch}"</span>. 
                Thử xóa bộ lọc hoặc tìm từ khóa khác nhé.
            </p>
          </div>
          <Link 
            to="/products"
            onClick={() => window.location.href='/products'}
            className="bg-gray-900 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-600 transition shadow-2xl active:scale-95"
          >
            Quay lại cửa hàng
          </Link>
        </div>
      )}
      {/* 3. PHÂN TRANG (Pagination) */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-10">
          <button 
            disabled={page === 1}
            onClick={() => setPage(prev => prev - 1)}
            className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:bg-red-600 hover:text-white transition disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-black text-lg text-gray-900 tracking-widest">
            {page} / {pagination.totalPages}
          </span>
          <button 
            disabled={page === pagination.totalPages}
            onClick={() => setPage(prev => prev + 1)}
            className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:bg-red-600 hover:text-white transition disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};