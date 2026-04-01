import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, PackageOpen } from 'lucide-react';

export const AdminProductManager = () => {
  const navigate = useNavigate();
  const BASE_URL = "http://localhost:5000";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 🚀 HELPER XỬ LÝ ẢNH (Đồng bộ với trang User Detail)
  const getImgUrl = (product) => {
    const path = product?.images?.[0];
    if (!path) return 'https://placehold.co/100x130?text=No+Image';
    
    // Nếu là ảnh preview (blob/base64)
    if (path.startsWith('data:') || path.startsWith('blob:')) return path;

    // Fix dấu xuyệt ngược Windows và xóa dấu / ở đầu (giống trang Detail)
    const cleanPath = path.replace(/\\/g, '/');
    const finalPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
    
    return `${BASE_URL}/${finalPath}`;
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/products');
      if (response.data.success) {
        // Soi dữ liệu để đảm bảo 'variants' đã được nhúng vào
        console.log("Products Data:", response.data.data);
        setProducts(response.data.data || []);
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa vĩnh viễn sản phẩm này?')) return;
    try {
      const res = await axiosInstance.delete(`/products/${id}`);
      if (res.data.success) {
        toast.success('Đã xóa sản phẩm thành công');
        fetchProducts();
      }
    } catch (error) {
      toast.error('Lỗi khi xóa sản phẩm');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-zinc-50/50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight uppercase italic">Inventory Admin</h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
            Đang quản lý {products.length} mặt hàng
          </p>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-grow lg:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
            <input 
              type="text" 
              placeholder="Tìm tên sản phẩm..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white rounded-xl text-xs font-bold border border-zinc-200 outline-none focus:border-black transition-all"
            />
          </div>
          <Link 
            to="/admin/products/create" 
            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[2px] hover:bg-zinc-800 transition shadow-xl shrink-0"
          >
            <Plus size={18} /> Thêm mới
          </Link>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-zinc-400 tracking-[3px]">Sản phẩm</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-zinc-400 tracking-[3px]">Danh mục</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-zinc-400 tracking-[3px]">Giá niêm yết</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-zinc-400 tracking-[3px]">Tồn kho</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-zinc-400 tracking-[3px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                [1, 2, 3].map(i => <tr key={i}><td colSpan="5" className="h-24 animate-pulse bg-zinc-50/20"></td></tr>)
              ) : filteredProducts.map((p) => {
                // 🚀 TÍNH TỔNG TỒN KHO TỪ VIRTUAL VARIANTS
                const totalStock = p.variants?.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) || 0;

                return (
                  <tr key={p._id} className="hover:bg-zinc-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-18 rounded-2xl overflow-hidden border border-zinc-100 bg-zinc-50 shrink-0">
                          <img 
                            src={getImgUrl(p)} 
                            alt={p.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://placehold.co/100x130?text=Error'; }}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-zinc-900 text-sm uppercase tracking-tight">{p.name}</p>
                          <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-tighter">REF: {p._id?.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-4 py-1.5 bg-zinc-100 text-zinc-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                        {p.category?.name || 'Basic'}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-black text-zinc-900 text-sm">
                      {p.price?.toLocaleString()} đ
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[11px] font-black ${totalStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {totalStock} PCS
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-3">
                        <Link to={`/admin/products/edit/${p._id}`} className="p-3 text-zinc-300 hover:text-black hover:bg-zinc-100 rounded-2xl transition-all"><Edit2 size={16}/></Link>
                        <button onClick={() => handleDelete(p._id)} className="p-3 text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {!loading && filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <PackageOpen size={40} className="mx-auto text-zinc-200 mb-4" />
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[4px]">Không tìm thấy sản phẩm</p>
          </div>
        )}
      </div>
    </div>
  );
};