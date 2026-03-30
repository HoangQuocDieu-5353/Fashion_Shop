import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const WishlistPage = () => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { fetchCartCount } = useCart();
  const BASE_URL = "http://localhost:5000";

  // Logic thêm nhanh vào giỏ hàng từ trang yêu thích
  const handleMoveToCart = async (product) => {
    // Lưu ý: Ở đây tui mặc định chọn Size/Màu đầu tiên nếu sản phẩm có nhiều option
    // Hoặc ông giáo có thể điều hướng về trang chi tiết để khách chọn kỹ hơn
    toast.success("Đang chuyển đến trang chi tiết để chọn size...");
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-20">
      <div className="max-w-[1200px] mx-auto px-6">
        
        {/* TIÊU ĐỀ TRANG */}
        <div className="text-center mb-20 space-y-4">
          <h1 className="text-[28px] font-black uppercase tracking-[10px] text-black italic">
            My Wishlist
          </h1>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[4px]">
            {wishlist.length} Sản phẩm đã được lưu
          </p>
          <div className="w-12 h-[1px] bg-black mx-auto mt-6"></div>
        </div>

        {wishlist.length === 0 ? (
          /* 🏠 TRẠNG THÁI TRỐNG */
          <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-200">
              <ShoppingBag size={40} strokeWidth={1} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-[12px] font-bold uppercase tracking-[3px] text-black">Danh sách yêu thích đang trống</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest italic">Hãy chọn những món đồ ông giáo ưng ý nhất nhé!</p>
            </div>
            <Link to="/products" className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[4px] border-b border-black pb-2 hover:gap-6 transition-all">
              Tiếp tục mua sắm <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          /* 🛍️ DANH SÁCH SẢN PHẨM */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 animate-in fade-in duration-700">
            {wishlist.map((product) => (
              <div key={product._id} className="group space-y-5 relative">
                
                {/* Ảnh sản phẩm */}
                <div className="relative aspect-[3/4] overflow-hidden bg-zinc-50 shadow-sm">
                  <img 
                    src={`${BASE_URL}${product.mainImage}`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    alt={product.name}
                  />
                  
                  {/* Nút Xóa khỏi Wishlist */}
                  <button 
                    onClick={() => toggleWishlist(product)}
                    className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md text-zinc-400 hover:text-red-500 transition-all rounded-full opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Thông tin */}
                <div className="text-center space-y-2">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-[3px]">
                    {product.category?.name || 'Collection'}
                  </p>
                  <Link to={`/products/${product._id}`}>
                    <h3 className="text-[13px] font-bold text-black hover:underline underline-offset-4 tracking-tight truncate px-2">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-[14px] font-black text-black">
                    {product.price.toLocaleString('vi-VN')} Đ
                  </p>
                  
                  {/* Nút Xem chi tiết / Mua ngay */}
                  <div className="pt-4">
                    <Link 
                      to={`/products/${product._id}`}
                      className="inline-block w-full py-3 border border-black text-[10px] font-black uppercase tracking-[3px] hover:bg-black hover:text-white transition-all duration-500"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};