import { useState, useEffect, useContext } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { SocketContext } from '../context/SocketContext';
import { TrendingUp, Package, ShoppingCart, AlertCircle } from 'lucide-react';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
/**
 * AdminDashboard - Trang thống kê mặc định cho Admin
 * Hiển thị: Cards thống kê nhanh + Biểu đồ doanh thu
 * Tích hợp SocketContext để nhận thông báo đơn hàng mới real-time
 */
export const AdminDashboard = () => {
  // ===== STATE QUẢN LÝ DỮ LIỆU =====
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { socket } = useContext(SocketContext);

  // ===== SOCKET.IO - NHẬN THÔNG BÁO ĐƠN HÀNG MỚI =====
  useEffect(() => {
    if (!socket) return;

    // Lắng nghe sự kiện "newOrder" từ server
    const handleNewOrder = (data) => {
      // Hiển thị toast thông báo
      toast.success(
        `🎉 Đơn hàng mới từ ${data.customerName} - ${data.totalAmount.toLocaleString('vi-VN')} VNĐ`,
        {
          duration: 5000,
          position: 'top-right',
        }
      );

      // Refresh dữ liệu thống kê
      fetchStats();
    };

    socket.on('newOrder', handleNewOrder);

    // Cleanup: Hủy lắng nghe khi component unmount
    return () => {
      socket.off('newOrder', handleNewOrder);
    };
  }, [socket]);

  // ===== FETCH DỮ LIỆU KHỞI TẠO =====
  useEffect(() => {
    fetchStats();
  }, []);

  /**
   * Lấy thống kê dashboard từ API
   */
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/orders/admin/dashboard-stats');
      if (response.data.success) {
        setStats(response.data.data);

        // Xử lý dữ liệu chart từ thống kê
        if (response.data.data.dailyRevenue) {
          setChartData(response.data.data.dailyRevenue);
        }
      }
    } catch (error) {
      console.error('Lỗi tải thống kê:', error);
      toast.error('Lỗi tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  // ===== RENDER JSX =====

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">📊 Bảng Điều Khiển</h1>
          <p className="text-gray-600 mt-1">
            Tổng quan về hoạt động kinh doanh của bạn
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition font-medium text-gray-700"
        >
          🔄 Làm mới
        </button>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Card 1: Tổng Doanh Thu */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-green-500 hover:shadow-lg transition">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-gray-600 text-sm font-medium">Tổng Doanh Thu</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {stats ? (
                  <>
                    {(stats.totalRevenue / 1000000).toFixed(1)}
                    <span className="text-lg">M</span>
                  </>
                ) : (
                  '0M'
                )}
              </h3>
              <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                <TrendingUp size={16} /> {stats?.revenueGrowth || '0'}% so với tháng trước
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp size={32} className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Card 2: Đơn Hàng Mới */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-gray-600 text-sm font-medium">Đơn Hàng Mới</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.newOrders || 0}
              </h3>
              <p className="text-blue-600 text-sm mt-2 flex items-center gap-1">
                <ShoppingCart size={16} /> Cần xử lý ngay
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart size={32} className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Card 3: Sản Phẩm Sắp Hết Hàng */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-orange-500 hover:shadow-lg transition">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-gray-600 text-sm font-medium">Hàng Sắp Hết</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.lowStockProducts || 0}
              </h3>
              <p className="text-orange-600 text-sm mt-2 flex items-center gap-1">
                <AlertCircle size={16} /> Cần nhập kho
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Package size={32} className="text-orange-600" />
            </div>
          </div>
        </div>

        {/* Card 4: Tổng Đơn Hàng */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-purple-500 hover:shadow-lg transition">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-gray-600 text-sm font-medium">Tổng Đơn Hàng</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalOrders || 0}
              </h3>
              <p className="text-purple-600 text-sm mt-2 flex items-center gap-1">
                <ShoppingCart size={16} /> Tất cả thời gian
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <ShoppingCart size={32} className="text-purple-600" />
            </div>
          </div>
        </div>
        {/* 🚀 CARD THỨ 5: QUẢN LÝ KHÁCH HÀNG */}
        <div 
          onClick={() => navigate('/admin/users')}
          className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-pink-500 hover:shadow-lg cursor-pointer transition-all active:scale-95 group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-gray-600 text-sm font-medium">Khách Hàng</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalUsers || 0}
              </h3>
              <p className="text-pink-600 text-sm mt-2 flex items-center gap-1 font-bold group-hover:underline">
                <Users size={16} /> Quản lý ngay
              </p>
            </div>
            <div className="p-3 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition">
              <Users size={32} className="text-pink-600" />
            </div>
          </div>
        </div>
      </div>


      {/* ===== BIỂU ĐỒ DOANH THU ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Area Chart - Doanh Thu Theo Ngày */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">📈 Doanh Thu Theo Ngày</h2>
            <p className="text-gray-600 text-sm mt-1">Biểu đồ doanh thu 7 ngày gần đây</p>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value) =>
                    `${(value / 1000000).toFixed(1)}M VNĐ`
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Chart 2: Quick Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition space-y-4">
          <h2 className="text-xl font-bold text-gray-900">📋 Thống Kê Nhanh</h2>

          {/* Pending Orders */}
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-gray-600 text-sm">Đơn Đang Xử Lý</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {stats?.pendingOrders || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              ⏳ Cần xác nhận và giao hàng
            </p>
          </div>

          {/* Confirmed Orders */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-gray-600 text-sm">Đơn Đã Xác Nhận</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {stats?.confirmedOrders || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              ✅ Đã xác nhận, đang giao hàng
            </p>
          </div>

          {/* Delivered Orders */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-gray-600 text-sm">Đơn Đã Giao</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {stats?.deliveredOrders || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              🎉 Giao hàng thành công
            </p>
          </div>

          {/* Cancelled Orders */}
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-gray-600 text-sm">Đơn Bị Hủy</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {stats?.cancelledOrders || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              ❌ Khách hàng hủy hoặc lỗi
            </p>
          </div>
        </div>
      </div>

      {/* ===== BOTTOM SECTION: BAR CHART ===== */}
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
        <h2 className="text-xl font-bold text-gray-900 mb-6">📊 So Sánh Trạng Thái Đơn Hàng</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              {
                name: 'Trạng Thái',
                'Pending (Chờ)': stats?.pendingOrders || 0,
                'Confirmed (Xác Nhận)': stats?.confirmedOrders || 0,
                'Delivered (Đã Giao)': stats?.deliveredOrders || 0,
                'Cancelled (Hủy)': stats?.cancelledOrders || 0,
              },
            ]}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="Pending (Chờ)" fill="#fbbf24" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Confirmed (Xác Nhận)" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Delivered (Đã Giao)" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Cancelled (Hủy)" fill="#ef4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
