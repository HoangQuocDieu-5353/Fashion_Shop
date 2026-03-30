import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Search, UserCog, Lock, Unlock, Mail, Phone, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminUserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/users/admin/all?search=${searchTerm}&page=${page}&limit=10`);
      if (res.data.success) {
        setUsers(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      toast.error("Không thể lấy danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    // 🚀 CHỐT: Đồng bộ định danh 'customer' thay vì 'user'
    const newRole = currentRole === 'admin' ? 'customer' : 'admin'; 
    const roleName = newRole === 'admin' ? 'QUẢN TRỊ VIÊN' : 'KHÁCH HÀNG';

    if (!window.confirm(`Xác nhận thay đổi quyền hạn thành ${roleName}?`)) return;

    try {
      const res = await axiosInstance.patch(`/users/admin/update-role/${userId}`, { role: newRole });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật quyền hạn");
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const action = currentStatus ? "TẠM KHÓA" : "MỞ KHÓA";
    if (!window.confirm(`Xác nhận ${action} tài khoản này?`)) return;

    try {
      const res = await axiosInstance.patch(`/users/admin/toggle-status/${userId}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật trạng thái");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-10 px-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-100 pb-8">
        <div className="space-y-1">
          <h1 className="text-[24px] font-bold uppercase tracking-[4px] text-black">Quản lý thành viên</h1>
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-[2px]">Kiểm soát định danh và trạng thái tài khoản hệ thống</p>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" size={16} />
          <input 
            type="text"
            placeholder="TÌM KIẾM TÊN / EMAIL..."
            className="w-full pl-8 pr-4 py-2 bg-transparent border-b border-gray-200 focus:border-black outline-none text-[12px] font-medium uppercase tracking-wider transition-all"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="py-4 text-[10px] font-bold text-black uppercase tracking-[2px]">Thành viên</th>
                <th className="py-4 text-[10px] font-bold text-black uppercase tracking-[2px]">Liên hệ</th>
                <th className="py-4 text-[10px] font-bold text-black uppercase tracking-[2px]">Vai trò</th>
                <th className="py-4 text-[10px] font-bold text-black uppercase tracking-[2px]">Trạng thái</th>
                <th className="py-4 text-[10px] font-bold text-black uppercase tracking-[2px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-black" size={24} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Đang đồng bộ cơ sở dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Không tìm thấy thành viên nào phù hợp
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 border border-black flex items-center justify-center text-[12px] font-bold bg-white group-hover:bg-black group-hover:text-white transition-all duration-300">
                          {u.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-black uppercase tracking-tight">{u.fullName}</p>
                          <p className="text-[9px] text-gray-400 font-bold">ID: {u._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6">
                      <div className="space-y-1 text-[12px] font-medium text-gray-600">
                        <p className="flex items-center gap-2"><Mail size={12} className="text-gray-300" /> {u.email}</p>
                        <p className="flex items-center gap-2"><Phone size={12} className="text-gray-300" /> {u.phone || '—'}</p>
                      </div>
                    </td>
                    <td className="py-6">
                      <span className={`text-[10px] font-bold uppercase tracking-[1px] ${u.role === 'admin' ? 'text-black' : 'text-gray-400'}`}>
                        {u.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                      </span>
                    </td>
                    <td className="py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-black' : 'bg-gray-200'}`}></div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${u.isActive ? 'text-black' : 'text-gray-300'}`}>
                          {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </div>
                    </td>
                    <td className="py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleToggleRole(u._id, u.role)}
                          className="p-2.5 text-black hover:bg-black hover:text-white transition-all border border-transparent hover:border-black"
                          title="Thay đổi vai trò"
                        >
                          <UserCog size={16} />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(u._id, u.isActive)}
                          className={`p-2.5 transition-all border border-transparent ${u.isActive ? 'text-black hover:border-red-500 hover:text-red-500' : 'text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500'}`}
                          title={u.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                        >
                          {u.isActive ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION SECTION */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center pt-8 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trang {page} trên {pagination.totalPages}</p>
          <div className="flex gap-4">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 border border-gray-200 hover:border-black disabled:opacity-10 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              disabled={page === pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 border border-gray-200 hover:border-black disabled:opacity-10 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};