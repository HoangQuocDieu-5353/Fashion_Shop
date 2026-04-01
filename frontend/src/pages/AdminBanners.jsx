import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { Plus, Trash2, Globe, Image as ImageIcon, Check, X } from 'lucide-react';

export const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newBanner, setNewBanner] = useState({ title: '', linkUrl: '/', sortOrder: 0, isActive: true });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    try {
      const res = await axiosInstance.get('/banners/admin');
      setBanners(res.data.data);
    } catch (error) { toast.error("Lỗi tải danh sách banner"); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!imageFile) return toast.error("Vui lòng chọn ảnh!");

    const formData = new FormData();
    formData.append('title', newBanner.title);
    formData.append('linkUrl', newBanner.linkUrl);
    formData.append('sortOrder', newBanner.sortOrder);
    formData.append('isActive', newBanner.isActive);
    formData.append('imageUrl', imageFile); // Trùng với cái upload.single('imageUrl') bên BE

    try {
      setLoading(true);
      await axiosInstance.post('/banners/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Thêm banner thành công!");
      setShowModal(false);
      fetchBanners();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi tạo banner");
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa thiệt nha ông giáo?")) return;
    try {
      await axiosInstance.delete(`/banners/delete/${id}`);
      toast.success("Đã xóa!");
      fetchBanners();
    } catch (error) { toast.error("Lỗi khi xóa"); }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black uppercase">Quản lý Banner ({banners.length})</h1>
        <button onClick={() => setShowModal(true)} className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold">
          <Plus size={18} /> Thêm Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map(banner => (
          <div key={banner._id} className="bg-white border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition">
            <img src={`http://localhost:5000${banner.imageUrl}`} className="w-full h-48 object-cover" alt="" />
            <div className="p-4">
              <h3 className="font-bold text-lg">{banner.title}</h3>
              <p className="text-xs text-zinc-400 mb-4 truncate">{banner.linkUrl}</p>
              <div className="flex justify-between items-center">
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${banner.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {banner.isActive ? 'Đang hiện' : 'Đang ẩn'}
                </span>
                <button onClick={() => handleDelete(banner._id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Thêm Banner - Ông giáo có thể style lại cho đẹp hơn */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreate} className="bg-white p-8 rounded-[32px] w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold uppercase mb-4">Tạo Banner Mới</h2>
            <input type="text" placeholder="Tiêu đề banner" className="w-full p-3 border rounded-xl" required
              onChange={e => setNewBanner({...newBanner, title: e.target.value})} />
            <input type="text" placeholder="Link điều hướng (ví dụ: /products)" className="w-full p-3 border rounded-xl"
              onChange={e => setNewBanner({...newBanner, linkUrl: e.target.value})} />
            <input type="file" className="w-full" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
            <div className="flex gap-4">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 font-bold">Hủy</button>
              <button type="submit" disabled={loading} className="flex-1 bg-black text-white py-3 rounded-xl font-bold">
                {loading ? 'Đang lưu...' : 'Lưu Banner'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};