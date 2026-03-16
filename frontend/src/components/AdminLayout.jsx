import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * AdminLayout - Layout chuyên dụng cho Admin
 * Gồm: Sidebar (trái) + Content Area (phải)
 * Sidebar cố định, Main content linh hoạt
 */
export const AdminLayout = ({ children }) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  /**
   * Menu items cho Admin
   */
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Thống Kê',
      icon: BarChart3,
      path: '/admin',
    },
    {
      id: 'products',
      label: 'Sản Phẩm',
      icon: Package,
      path: '/admin/products',
    },
    {
      id: 'orders',
      label: 'Đơn Hàng',
      icon: ShoppingBag,
      path: '/admin/orders',
    },
    {
      id: 'categories',
      label: 'Danh Mục',
      icon: ListOrdered,
      path: '/admin/categories',
    },
    {
      id: 'customers',
      label: 'Khách Hàng',
      icon: Users,
      path: '/admin/users',
    },
  ];

  /**
   * Kiểm tra menu item có active không
   */
  const isActive = (path) => {
    // Nếu là trang chủ Admin, yêu cầu khớp chính xác tuyệt đối
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    
    // Với các trang khác (Sản phẩm, Đơn hàng...), cho phép sáng khi vào trang con (ví dụ: /edit/:id)
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  /**
   * Xử lý logout
   */
  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      logout();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* ===== SIDEBAR ===== */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl flex flex-col transition-all duration-300 fixed left-0 top-0 h-screen z-40`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {isSidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center font-bold text-sm">
                  👗
                </div>
                <h1 className="text-lg font-bold">AdminHub</h1>
              </div>
            </>
          ) : (
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center font-bold mx-auto">
              👗
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-gray-700 rounded transition"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* User Info */}
        {isSidebarOpen && (
          <div className="p-4 border-b border-gray-700">
            <p className="text-sm text-gray-400">Xin chào,</p>
            <p className="font-semibold truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
                title={item.label}
              >
                <Icon size={20} className={isSidebarOpen ? '' : 'mx-auto'} />
                {isSidebarOpen && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight size={16} />}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 hover:bg-red-600 text-white rounded-lg transition-all"
            title="Đăng xuất"
          >
            <LogOut size={20} className={isSidebarOpen ? '' : 'mx-auto w-full'} />
            {isSidebarOpen && <span>Đăng Xuất</span>}
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT AREA ===== */}
      <main
        className={`${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        } flex-1 flex flex-col transition-all duration-300 overflow-hidden`}
      >
        {/* Top Bar */}
        <div className="bg-white shadow-sm p-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Bảng Điều Khiển Quản Trị
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Chào mừng trở lại, {user?.fullName || 'Admin'}
            </p>
          </div>

          {/* Notification Badge - Placeholder for future use */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-2 hover:bg-gray-100 rounded-full transition">
                🔔
              </button>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
          </div>
        </div>

        {/* Content Area - Hiển thị nội dung từ children */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {children}
        </div>
      </main>
    </div>
  );
};
