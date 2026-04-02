import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ShoppingBag,
  Package,
  ListOrdered,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  MessageSquare,
  Bell,
  Hexagon,
  Ticket,
  AlertTriangle,
  Clock,
  Undo2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../context/NotificationContext'; // 🚀 Hook thông báo

export const AdminLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // 🚀 LOGIC THÔNG BÁO CHO ADMIN
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Thống Kê', icon: BarChart3, path: '/admin' },
    { id: 'products', label: 'Sản Phẩm', icon: Package, path: '/admin/products' },
    { id: 'orders', label: 'Đơn Hàng', icon: ShoppingBag, path: '/admin/orders' },
    { id: 'categories', label: 'Danh Mục', icon: ListOrdered, path: '/admin/categories' },
    { id: 'customers', label: 'Khách Hàng', icon: Users, path: '/admin/users' },
    { id: 'reviews', label: 'Đánh Giá', icon: MessageSquare, path: '/admin/reviews' },
    { id: 'coupons', label: 'Mã Giảm Giá', icon: Ticket, path: '/admin/coupons' },
    {id: 'refunds',label: 'Đổi Trả',icon: Undo2,path: '/admin/refunds',},
  ];

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
      logout();
    }
  };

  // Helper render icon cho Admin
  const getAdminNotifIcon = (type) => {
    switch (type) {
      case 'ORDER': return <ShoppingBag size={14} className="text-blue-500" />;
      case 'SYSTEM': return <AlertTriangle size={14} className="text-red-500" />;
      case 'REVIEW': return <MessageSquare size={14} className="text-amber-500" />;
      default: return <Bell size={14} className="text-zinc-400" />;
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 font-sans selection:bg-black selection:text-white">
      {/* ===== SIDEBAR (Giữ nguyên logic của ông giáo) ===== */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-zinc-950 text-zinc-400 flex flex-col transition-all duration-300 fixed left-0 top-0 h-screen z-40 border-r border-zinc-900`}>
        <div className="h-20 border-b border-zinc-900 flex items-center justify-between px-6">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center shadow-lg"><Hexagon size={18} fill="currentColor" /></div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase">AdminHub</h1>
            </div>
          ) : (
            <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center mx-auto"><Hexagon size={18} fill="currentColor" /></div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-zinc-500 hover:text-white transition">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isSidebarOpen && (
          <div className="px-6 py-8">
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-zinc-600 mb-2">Quản trị viên</p>
            <p className="text-sm font-bold text-white truncate">{user?.fullName || 'Admin User'}</p>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto pb-4 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.id} to={item.path} className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${active ? 'bg-white text-black shadow-lg shadow-white/5 font-bold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white font-medium'}`}>
                <Icon size={18} className={isSidebarOpen ? '' : 'mx-auto shrink-0'} strokeWidth={active ? 2.5 : 2} />
                {isSidebarOpen && <span className="flex-1 text-xs uppercase tracking-widest">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-4 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-2xl transition-all">
            <LogOut size={18} className={isSidebarOpen ? '' : 'mx-auto'} />
            {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-widest">Đăng Xuất</span>}
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT AREA ===== */}
      <main className={`${isSidebarOpen ? 'ml-64' : 'ml-20'} flex-1 flex flex-col transition-all duration-300 min-w-0`}>
        
        {/* TOP BAR CẬP NHẬT */}
        <div className="h-20 bg-white border-b border-zinc-200 px-8 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h2 className="text-lg font-black text-black tracking-tight uppercase">Hệ thống Quản trị</h2>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[2px] mt-1">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-6">
            
            {/* 🚀 CHUÔNG THÔNG BÁO ADMIN */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative p-3 rounded-full transition-all duration-300 ${
                  unreadCount > 0 ? 'bg-zinc-900 text-white animate-pulse' : 'bg-zinc-100 text-zinc-400 hover:text-black'
                }`}
              >
                <Bell size={20} strokeWidth={unreadCount > 0 ? 2.5 : 2} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown thông báo cho sếp (Admin) */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-white border border-zinc-200 shadow-2xl rounded-[24px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 z-50">
                  <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[3px]">Thông báo hệ thống</span>
                    <span className="text-[8px] font-bold bg-black text-white px-2 py-0.5 rounded-full uppercase">{unreadCount} mới</span>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center">
                        <Clock size={24} className="mx-auto text-zinc-100 mb-2" />
                        <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest italic">Mọi thứ đều ổn định</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n._id}
                          onClick={() => { markAsRead(n._id); navigate(n.link || '/admin'); setIsNotifOpen(false); }}
                          className={`px-6 py-5 border-b border-zinc-50 hover:bg-zinc-50 cursor-pointer transition-all flex gap-4 ${!n.isRead ? 'bg-zinc-50/80 border-l-4 border-l-black' : ''}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-white border border-zinc-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                            {getAdminNotifIcon(n.type)}
                          </div>
                          <div className="space-y-1">
                            <p className="text-[11px] font-black uppercase text-black tracking-tight leading-tight">{n.title}</p>
                            <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{n.message}</p>
                            <p className="text-[8px] text-zinc-300 uppercase font-black pt-1 italic">{new Date(n.createdAt).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Link to="/admin/notifications" onClick={() => setIsNotifOpen(false)} className="block w-full py-4 text-center text-[9px] font-black uppercase tracking-[4px] bg-zinc-950 text-white hover:bg-black transition-all">
                    Nhật ký vận hành
                  </Link>
                </div>
              )}
            </div>

            {/* Admin Avatar */}
            <div className="flex items-center gap-3 pl-4 border-l border-zinc-200">
               <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-black uppercase">{user?.fullName}</p>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Administrator</p>
               </div>
               <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-2xl font-black text-sm shadow-xl shadow-black/10">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-8">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};