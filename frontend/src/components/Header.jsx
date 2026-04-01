import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext'; // 🚀 Thêm Wishlist
import { ShoppingBag, User, Menu, X, Search, Heart, Package } from 'lucide-react';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist(); // 🚀 Lấy data từ Wishlist
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const BASE_URL = "http://localhost:5000";

  // Tự động đóng menu mobile khi chuyển trang
  useEffect(() => setIsMenuOpen(false), [location]);

  const handleQuickSearch = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    if (value.trim()) navigate(`/products?search=${value}`);
    else navigate('/products');
  };

  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
  };

  // Mảng menu: Đơn hàng chỉ hiện khi đã đăng nhập
  const navLinks = [
    { name: 'Sản phẩm', path: '/products' },
    { name: 'Danh mục', path: '/categories' },
    { name: 'Bộ sưu tập', path: '/collections' },
    ...(isAuthenticated ? [{ name: 'Đơn hàng', path: '/orders' }] : [])
  ];

  return (
    <header className="fixed top-0 w-full z-[100] bg-white border-b border-zinc-100 shadow-sm py-4">
      <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center">
        
        {/* 1. LOGO */}
        <Link to="/" className="relative z-[110]">
          <h1 className="text-[18px] font-black tracking-[4px] text-black uppercase">
            Fashion<span className="font-light">Shop</span>
          </h1>
        </Link>

        {/* 2. NAVIGATION (Desktop) */}
        <nav className="hidden lg:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link, idx) => (
            <Link 
              key={idx} 
              to={link.path}
              className={`text-[10px] font-bold uppercase tracking-[3px] transition-colors relative group ${
                location.pathname === link.path ? 'text-black' : 'text-zinc-400 hover:text-black'
              }`}
            >
              {link.name}
              <span className={`absolute -bottom-1 left-0 h-[1.5px] bg-black transition-all ${
                location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>
          ))}
        </nav>

        {/* 3. ACTIONS (Search, Wishlist, Cart, User) */}
        <div className="flex items-center gap-6 relative z-[110]">
          
          {/* Thanh tìm kiếm Pill-Style */}
          <div className="hidden md:flex items-center bg-zinc-50 border border-zinc-100 rounded-full px-4 py-2 focus-within:bg-white focus-within:border-zinc-300 transition-all">
            <Search size={14} className="text-zinc-400" />
            <input 
              type="text"
              placeholder="TÌM KIẾM..."
              className="bg-transparent outline-none text-[10px] font-bold tracking-widest px-3 w-32 focus:w-48 transition-all uppercase placeholder:text-zinc-300"
              value={searchValue}
              onChange={handleQuickSearch}
            />
          </div>

          <div className="flex items-center gap-4">
            {/* 🚀 NÚT TRÁI TIM YÊU THÍCH (Wishlist) */}
            <Link to="/wishlist" className="relative text-black p-2 group">
              <Heart 
                size={20} 
                strokeWidth={1.5} 
                className={`transition-all duration-300 ${
                  wishlist?.length > 0 ? "text-red-500 fill-red-500 scale-110" : "text-zinc-400 hover:text-black"
                }`} 
              />
              {wishlist?.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* GIỎ HÀNG (Cart) */}
            <Link to="/cart" className="relative text-black group p-2">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-black text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* USER / AVATAR */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center hover:shadow-md transition-all overflow-hidden border border-zinc-200">
                  {user.avatar ? (
                    <img 
                      src={getAvatarUrl(user.avatar)} 
                      className="w-full h-full object-cover" 
                      alt="User Avatar"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = `https://ui-avatars.com/api/?name=${user.fullName}&background=f4f4f5&color=a1a1aa`;
                      }}
                    />
                  ) : (
                    <User size={18} className="text-zinc-400" />
                  )}
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-4 w-56 bg-white border border-zinc-100 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 p-2 rounded-sm">
                  <div className="px-4 py-3 border-b border-zinc-50 mb-1">
                    <p className="text-[11px] font-bold text-black truncate">{user.fullName}</p>
                    <p className="text-[9px] text-zinc-400 truncate">{user.email}</p>
                  </div>
                  <Link to="/profile" className="block px-4 py-2 text-[9px] font-bold text-zinc-500 hover:bg-zinc-50 hover:text-black uppercase tracking-widest transition">Hồ sơ cá nhân</Link>
                  <Link to="/orders" className="block px-4 py-2 text-[9px] font-bold text-zinc-500 hover:bg-zinc-50 hover:text-black uppercase tracking-widest transition">Lịch sử đơn hàng</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-2 text-[9px] font-bold text-black bg-zinc-100 uppercase tracking-widest transition mt-1">Quản trị hệ thống</Link>
                  )}
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-[9px] font-bold text-red-500 hover:bg-red-50 uppercase tracking-widest transition mt-2 border-t border-zinc-50 pt-3">Đăng xuất</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="text-[10px] font-black uppercase tracking-[3px] bg-black text-white px-6 py-2.5 hover:bg-zinc-800 transition-all hidden sm:block">
                Login
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button className="lg:hidden text-black p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. MOBILE MENU OVERLAY */}
      <div className={`fixed inset-0 bg-white z-[105] transition-transform duration-700 lg:hidden ${
        isMenuOpen ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="h-full flex flex-col items-center justify-center space-y-10">
          {navLinks.map((link, idx) => (
            <Link 
              key={idx} 
              to={link.path}
              className="text-2xl font-black uppercase tracking-[10px] text-zinc-300 hover:text-black transition-all"
            >
              {link.name}
            </Link>
          ))}
          {!isAuthenticated && (
            <Link to="/login" className="text-[12px] font-black uppercase tracking-[5px] pt-10 text-black underline underline-offset-8">Đăng nhập</Link>
          )}
        </div>
      </div>
    </header>
  );
};