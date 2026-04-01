import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { X, Upload, ArrowLeft, Plus, Trash2 } from 'lucide-react';

// 🚀 BỘ GIÁ TRỊ CHUẨN
const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
const AVAILABLE_COLORS = ['Đen', 'Trắng', 'Xám', 'Xanh Navy', 'Đỏ', 'Be', 'Vàng', 'Hồng', 'Xanh Lá'];

export const AdminProductEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const BASE_URL = "http://localhost:5000";

  // State
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // FORM DATA MỚI
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    description: '',
    category: '',
    variants: [{ size: '', color: '', stock: 0, price: '' }],
    mainImage: null,
    secondaryImages: [],
  });

  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [secondaryImagesPreview, setSecondaryImagesPreview] = useState([]);

  // 🚀 ĐÃ SỬA LẠI: Hàm nhận vào đường dẫn CHUỖI (String) thay vì Object
  const getImgUrl = (path) => {
    if (!path) return 'https://placehold.co/400x500?text=No+Image';
    if (path.startsWith('data:') || path.startsWith('blob:')) return path;

    // Sửa lỗi dấu xuyệt Windows
    let cleanPath = path.replace(/\\/g, '/');
    cleanPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
    return `${BASE_URL}/${cleanPath}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);

        const catRes = await axiosInstance.get('/categories');
        if (catRes.data.success) setCategories(catRes.data.data);

        const productRes = await axiosInstance.get(`/products/${id}`);
        if (productRes.data.success && productRes.data.data) {
          const p = productRes.data.data;
          
          setFormData({
            name: p.name || '',
            price: p.price || 0,
            description: p.description || '',
            category: p.category?._id || p.category || '',
            variants: p.variants && p.variants.length > 0 
              ? p.variants.map(v => ({
                  size: v.size,
                  color: v.color,
                  stock: v.stock || 0,
                  price: v.price || ''
                }))
              : [{ size: '', color: '', stock: 0, price: '' }],
            mainImage: null,
            secondaryImages: [],
          });

          // Lấy mảng ảnh từ DB (Nếu không có thì dùng mảng rỗng)
          const dbImages = p.images || [];
          
          if (dbImages.length > 0) {
            setMainImagePreview(getImgUrl(dbImages[0]));
            setSecondaryImagesPreview(dbImages.map(img => getImgUrl(img)));
          }
        }
      } catch (error) {
        toast.error('Lỗi tải thông tin sản phẩm');
        navigate('/admin/products');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // ===== LOGIC BIẾN THỂ =====
  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { size: '', color: '', stock: 0, price: '' }]
    }));
  };

  const removeVariant = (index) => {
    if (formData.variants.length === 1) return toast.error("Phải có ít nhất 1 biến thể");
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: newVariants });
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    setFormData({ ...formData, variants: newVariants });
  };

  // ===== IMAGE HANDLERS =====
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, mainImage: file }));
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSecondaryImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, secondaryImages: files }));
    
    // Tạo preview URL cho mảng ảnh mới
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setSecondaryImagesPreview(newPreviews);
    if (newPreviews.length > 0) setMainImagePreview(newPreviews[0]); // Chuyển ảnh chính về ảnh đầu tiên
  };

  // ===== SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isVariantsValid = formData.variants.every(v => v.size && v.color);
    if (!isVariantsValid) return toast.error("Vui lòng điền đủ Size và Màu cho các biến thể");

    try {
      setLoading(true);
      const fData = new FormData();
      fData.append('name', formData.name);
      fData.append('price', formData.price);
      fData.append('description', formData.description);
      fData.append('category', formData.category);
      fData.append('variants', JSON.stringify(formData.variants));

      if (formData.mainImage) fData.append('images', formData.mainImage);
      formData.secondaryImages.forEach(img => fData.append('images', img));

      const response = await axiosInstance.put(`/products/${id}`, fData);

      if (response.data.success) {
        toast.success('Cập nhật sản phẩm thành công');
        navigate('/admin/products');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="flex items-center justify-center h-screen animate-pulse font-bold text-gray-400">ĐANG TẢI DỮ LIỆU...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black uppercase tracking-tighter">✏️ Chỉnh sửa sản phẩm</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CỘT TRÁI: ẢNH */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Ảnh xem trước</label>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed flex items-center justify-center group mb-4">
              <input type="file" onChange={handleMainImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" title="Đổi ảnh chính" />
              {mainImagePreview ? (
                <img src={mainImagePreview} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <Upload size={40} className="text-gray-200" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">Tải ảnh mới</div>
            </div>

            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Gallery ({secondaryImagesPreview.length} ảnh)</label>
            <input type="file" multiple onChange={handleSecondaryImagesChange} className="mb-4 text-xs w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-gray-50 file:text-black hover:file:bg-gray-100 cursor-pointer" />
            
            {/* 🚀 LIST ẢNH PHỤ CÓ THỂ BẤM ĐỂ PREVIEW */}
            <div className="grid grid-cols-4 gap-2">
              {secondaryImagesPreview.map((src, i) => (
                <img 
                  key={i} 
                  src={src} 
                  onClick={() => setMainImagePreview(src)}
                  className={`aspect-square object-cover rounded-xl border cursor-pointer transition-all hover:opacity-80 ${mainImagePreview === src ? 'ring-2 ring-black ring-offset-1' : 'opacity-60'}`} 
                  alt={`gallery-${i}`} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: INFO & VARIANTS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-gray-400">Thông tin cơ bản</label>
              <input type="text" name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Tên sản phẩm" className="w-full text-2xl font-bold outline-none border-b-2 focus:border-black py-2" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Giá niêm yết</label>
                <input type="number" name="price" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none border focus:border-black font-bold" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Danh mục</label>
                <select name="category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none border focus:border-black font-bold" required>
                  <option value="">Chọn danh mục</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Mô tả chi tiết</label>
              <textarea name="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="4" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border focus:border-black text-sm" required />
            </div>
          </div>

          {/* 🚀 QUẢN LÝ BIẾN THỂ - ĐÃ CHUYỂN SANG LIGHT MODE */}
          <div className="bg-white p-8 rounded-[32px] shadow-sm border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest">Biến thể & Tồn kho</h2>
              <button type="button" onClick={addVariant} className="bg-black text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition shadow-md">+ Thêm dòng</button>
            </div>

            <div className="space-y-3">
              {formData.variants.map((v, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 hover:border-gray-300 transition-all">
                  <div className="col-span-3">
                    <select value={v.size} onChange={e => handleVariantChange(index, 'size', e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none cursor-pointer">
                      <option value="">Size</option>
                      {AVAILABLE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3 border-l border-gray-200 pl-3">
                    <select value={v.color} onChange={e => handleVariantChange(index, 'color', e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none cursor-pointer">
                      <option value="">Màu sắc</option>
                      {AVAILABLE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 border-l border-gray-200 pl-3">
                    <input type="number" placeholder="Kho" value={v.stock} onChange={e => handleVariantChange(index, 'stock', e.target.value)} className="w-full bg-transparent text-sm font-bold outline-none text-gray-900" />
                  </div>
                  <div className="col-span-3 border-l border-gray-200 pl-3">
                    <input type="number" placeholder="Giá riêng lẻ" value={v.price} onChange={e => handleVariantChange(index, 'price', e.target.value)} className="w-full bg-transparent text-xs font-medium outline-none text-gray-900" />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button type="button" onClick={() => removeVariant(index)} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="flex-1 bg-black text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-gray-200 hover:bg-zinc-800 transition disabled:opacity-50">
              {loading ? 'ĐANG LƯU DỮ LIỆU...' : 'XÁC NHẬN CẬP NHẬT'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};