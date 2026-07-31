import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationContext'; // 🚀 Hook mới
import { ShoppingBag, User, Menu, X, Search, Heart, Bell, Package, Gift, Settings } from 'lucide-react';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  
  // 🚀 Logic Thông báo
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  const BASE_URL = "http://localhost:5000";

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setIsMenuOpen(false), [location]);

  const handleQuickSearch = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    if (value.trim()) navigate(`/products?search=${value}`);
    else navigate('/products');
  };

  // Helper render icon theo loại thông báo
  const getNotifIcon = (type) => {
    switch (type) {
      case 'ORDER': return <Package size={12} className="text-black" />;
      case 'PROMOTION': return <Gift size={12} className="text-red-500" />;
      default: return <Settings size={12} className="text-zinc-400" />;
    }
  };

  const navLinks = [
    { name: 'Sản phẩm', path: '/products' },
    { name: 'Danh mục', path: '/categories' },
    { name: 'Bộ sưu tập', path: '/collections' },
    ...(isAuthenticated ? [{ name: 'Đơn hàng', path: '/orders' }] : [])
  ];

  return (
    <header 
      style={{ fontFamily: "'Jost', sans-serif" }}
      className={`fixed top-0 w-full z-[100] transition-all duration-500 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md py-3 shadow-sm' : 'bg-white py-5'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-8 flex justify-between items-center">
        
        {/* 1. LOGO */}
        <Link to="/" className="relative z-[110]">
          <h1 style={{ fontFamily: "'Montserrat', sans-serif" }} className="text-[18px] font-black tracking-[6px] text-black uppercase">
            VST COMPUTER<span className="font-light text-zinc-300">.</span>
          </h1>
        </Link>

        {/* 2. NAVIGATION */}
        <nav className="hidden lg:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link, idx) => (
            <Link 
              key={idx} 
              to={link.path}
              className={`text-[9px] font-bold uppercase tracking-[0.3em] transition-all duration-300 relative group ${
                location.pathname === link.path ? 'text-black' : 'text-zinc-400 hover:text-black'
              }`}
            >
              {link.name}
              <span className={`absolute -bottom-1.5 left-0 h-[1px] bg-black transition-all duration-500 ${
                location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </Link>
          ))}
        </nav>

        {/* 3. ACTIONS */}
        <div className="flex items-center gap-1 md:gap-2 relative z-[110]">
          
          {/* Search */}
          <div className="hidden md:flex items-center bg-zinc-50 rounded-full px-4 py-1.5 border border-zinc-100 focus-within:bg-white focus-within:border-zinc-300 transition-all mr-2">
            <Search size={12} className="text-zinc-400" />
            <input 
              type="text"
              placeholder="SEARCH..."
              className="bg-transparent outline-none text-[8px] font-black tracking-[0.2em] px-3 w-20 focus:w-32 transition-all uppercase placeholder:text-zinc-300"
              value={searchValue}
              onChange={handleQuickSearch}
            />
          </div>

          <div className="flex items-center">
            {/* WISHLIST */}
            <Link to="/wishlist" className="relative p-2.5 group">
              <Heart 
                size={18} 
                strokeWidth={1.5} 
                className={`transition-all duration-500 group-hover:scale-110 ${
                  wishlist?.length > 0 ? "fill-black text-black" : "text-black/60"
                }`} 
              />
            </Link>

            {/* 🚀 NOTIFICATIONS (Cái Chuông Mới) */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2.5 group relative"
              >
                <Bell size={18} strokeWidth={1.5} className="text-black/60 group-hover:text-black transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-[6px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Thông báo */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-4 w-72 bg-white border border-zinc-100 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="px-5 py-4 border-b border-zinc-50 flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-[3px]">Thông báo</span>
                    {unreadCount > 0 && <span className="text-[7px] font-bold text-red-500 uppercase tracking-widest">{unreadCount} mới</span>}
                  </div>
                  
                  <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center space-y-2">
                        <Bell size={20} className="mx-auto text-zinc-100" />
                        <p className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest italic">Hộp thư trống</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n._id} 
                          onClick={() => { markAsRead(n._id); navigate(n.link || '#'); setIsNotifOpen(false); }}
                          className={`px-5 py-4 border-b border-zinc-50 hover:bg-zinc-50 cursor-pointer transition-all flex gap-4 ${!n.isRead ? 'bg-zinc-50/50' : ''}`}
                        >
                          <div className="mt-1">{getNotifIcon(n.type)}</div>
                          <div className="space-y-1">
                            <p className={`text-[10px] uppercase tracking-tight ${!n.isRead ? 'font-black text-black' : 'font-medium text-zinc-500'}`}>{n.title}</p>
                            <p className="text-[9px] text-zinc-400 leading-relaxed line-clamp-2">{n.message}</p>
                            <p className="text-[7px] text-zinc-300 uppercase font-bold">{new Date(n.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <Link 
                    to="/notifications" 
                    onClick={() => setIsNotifOpen(false)}
                    className="block w-full py-3 text-center text-[8px] font-black uppercase tracking-[4px] bg-zinc-50 hover:bg-black hover:text-white transition-all"
                  >
                    Xem tất cả
                  </Link>
                </div>
              )}
            </div>

            {/* CART */}
            <Link to="/cart" className="relative p-2.5 group">
              <ShoppingBag size={18} strokeWidth={1.5} className="group-hover:scale-110 transition-transform text-black/60" />
              {cartCount > 0 && (
                <span className="absolute top-2 right-2 bg-black text-white text-[7px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* USER AVATAR */}
            {isAuthenticated ? (
              <div className="relative group ml-1">
                <button className="w-7 h-7 rounded-full border border-zinc-200 overflow-hidden hover:border-black transition-all">
                  <img 
                    src={user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}`) : `https://ui-avatars.com/api/?name=${user.fullName}&background=f4f4f5&color=000&font-size=0.4`} 
                    className="w-full h-full object-cover" 
                    alt="avatar"
                  />
                </button>
                <div className="absolute right-0 mt-2 w-44 bg-white border border-zinc-100 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-2 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 border-b border-zinc-50">
                    <p className="text-[9px] font-black uppercase tracking-widest text-black truncate">{user.fullName}</p>
                    <p className="text-[7px] text-zinc-400 truncate">{user.email}</p>
                  </div>
                  <Link to="/profile" className="block px-4 py-2 text-[8px] font-bold text-zinc-500 hover:bg-zinc-50 hover:text-black uppercase tracking-[0.2em] transition">Tài khoản</Link>
                  <Link to="/orders" className="block px-4 py-2 text-[8px] font-bold text-zinc-500 hover:bg-zinc-50 hover:text-black uppercase tracking-[0.2em] transition">Đơn hàng</Link>
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-[8px] font-bold text-red-400 hover:bg-red-50 uppercase tracking-[0.2em] transition">Thoát</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="ml-2 p-2 text-zinc-400 hover:text-black transition-colors">
                <User size={18} strokeWidth={1.5} />
              </Link>
            )}

            {/* Mobile Menu */}
            <button className="lg:hidden ml-2 text-black" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};