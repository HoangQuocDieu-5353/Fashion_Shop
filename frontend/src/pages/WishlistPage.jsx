import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion'; // Nếu ông giáo có cài framer-motion, không thì dùng class animate-in

export const WishlistPage = () => {
  const { wishlist, toggleWishlist, loading } = useWishlist();
  const BASE_URL = "http://localhost:5000";

  // Helper lấy ảnh chuẩn chỉnh
  const getImgUrl = (path) => {
    if (!path) return 'https://placehold.co/400x500?text=No+Image';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${BASE_URL}/${cleanPath}`;
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center text-[10px] font-bold tracking-[5px] text-zinc-300 uppercase animate-pulse">
      Đang tải danh sách...
    </div>
  );

  return (
    <div className="bg-white min-h-screen pt-40 pb-20" style={{ fontFamily: "'Jost', sans-serif" }}>
      <div className="max-w-[1400px] mx-auto px-8">
        
        {/* HEADER TRANG */}
        <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-zinc-100 pb-12">
          <div className="space-y-4">
            <h1 style={{ fontFamily: "'Montserrat', sans-serif" }} className="text-[32px] font-black uppercase tracking-[12px] text-black">
              MY <span className="text-zinc-300 font-light italic">WISHLIST</span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[4px]">
              {wishlist?.length || 0} Sản phẩm tâm đắc
            </p>
          </div>
          <Link to="/products" className="text-[10px] font-bold uppercase tracking-[3px] text-zinc-400 hover:text-black transition-all flex items-center gap-3 group">
            Khám phá thêm <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform"/>
          </Link>
        </div>

        {(!wishlist || wishlist.length === 0) ? (
          /* 🏠 TRẠNG THÁI TRỐNG */
          <div className="flex flex-col items-center justify-center py-32 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="relative">
               <ShoppingBag size={80} strokeWidth={0.5} className="text-zinc-100" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-black rounded-full animate-ping"></div>
               </div>
            </div>
            <div className="text-center space-y-3">
              <h2 className="text-[13px] font-bold uppercase tracking-[5px] text-black">Danh sách đang trống</h2>
              <p className="text-[11px] text-zinc-400 uppercase tracking-[2px] italic">"Phong cách là một cách để nói bạn là ai mà không cần phải nói."</p>
            </div>
            <Link to="/products" className="bg-black text-white px-12 py-5 text-[10px] font-bold uppercase tracking-[4px] hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-100">
              Bắt đầu lựa chọn
            </Link>
          </div>
        ) : (
          /* 🛍️ DANH SÁCH SẢN PHẨM */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
            {wishlist.map((product) => (
              <div key={product._id} className="group">
                
                {/* Image Container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-zinc-50 mb-6">
                  <Link to={`/products/${product._id}`}>
                    <img 
                      // Ưu tiên images[0] vì backend thường trả về mảng ảnh
                      src={getImgUrl(product.images?.[0] || product.mainImage)} 
                      className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110" 
                      alt={product.name}
                    />
                  </Link>
                  
                  {/* Quick Delete */}
                  <button 
                    onClick={() => toggleWishlist(product)}
                    className="absolute top-5 right-5 w-10 h-10 bg-white/90 backdrop-blur-sm flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-white transition-all duration-300 rounded-full shadow-sm translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>

                  {/* Overlay Button */}
                  <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <Link 
                      to={`/products/${product._id}`}
                      className="w-full bg-white/95 backdrop-blur-md py-4 text-[9px] font-bold uppercase tracking-[3px] flex items-center justify-center gap-3 hover:bg-black hover:text-white transition-all"
                    >
                      XEM CHI TIẾT <ArrowRight size={12}/>
                    </Link>
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-3 text-center">
                  <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-[4px]">
                    {product.category?.name || 'Essential'}
                  </p>
                  <Link to={`/products/${product._id}`}>
                    <h3 className="text-[12px] font-bold text-black uppercase tracking-widest hover:text-zinc-500 transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-center gap-4">
                     <span className="text-[13px] font-black text-black tracking-tighter">
                       {product.price?.toLocaleString('vi-VN')} VNĐ
                     </span>
                  </div>
                  
                  {/* Stock Status */}
                  {product.stock <= 0 && (
                    <p className="text-[8px] font-bold text-red-500 uppercase tracking-widest">Tạm hết hàng</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};