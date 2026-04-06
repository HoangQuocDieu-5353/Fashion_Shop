import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { Plus, Upload, ArrowLeft, Trash2 } from 'lucide-react';

const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
const AVAILABLE_COLORS = ['Đen', 'Trắng', 'Xám', 'Xanh Navy', 'Đỏ', 'Be', 'Vàng', 'Hồng', 'Xanh Lá'];

export const AdminProductAdd = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', price: '', description: '', category: '',
    variants: [{ size: '', color: '', stock: 0, price: '' }],
  });

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    axiosInstance.get('/categories').then(res => setCategories(res.data.data || []));
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    setFormData({ ...formData, variants: newVariants });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) return toast.error("Vui lòng thêm ít nhất 1 ảnh");

    try {
      setLoading(true);
      const fData = new FormData();
      fData.append('name', formData.name);
      fData.append('price', formData.price);
      fData.append('description', formData.description);
      fData.append('category', formData.category);
      fData.append('variants', JSON.stringify(formData.variants));
      images.forEach(img => fData.append('images', img));

      const res = await axiosInstance.post('/products', fData);
      if (res.data.success) {
        toast.success('Tạo sản phẩm thành công!');
        navigate('/admin/products');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4 pt-10">
      <div className="flex items-center gap-6 mb-12">
        <button onClick={() => navigate('/admin/products')} className="w-12 h-12 flex items-center justify-center bg-white border rounded-full hover:bg-black hover:text-white transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-4xl font-black uppercase tracking-tighter italic">✨ Thêm Sản Phẩm Mới</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* ALBUM ẢNH */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-zinc-100 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[4px] text-zinc-400 mb-6">Hình ảnh sản phẩm</h2>
            <div className="grid grid-cols-2 gap-4">
              {previews.map((src, idx) => (
                <div key={idx} className="relative aspect-[3/4] rounded-2xl overflow-hidden border group">
                  <img src={src} className="w-full h-full object-cover" alt="preview" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <label className="aspect-[3/4] border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-black transition-all">
                <input type="file" multiple onChange={handleImageChange} className="hidden" accept="image/*" />
                <Plus size={32} className="text-zinc-300" />
                <span className="text-[9px] font-black uppercase mt-2 text-zinc-400">Tải ảnh lên</span>
              </label>
            </div>
          </div>
        </div>

        {/* THÔNG TIN & BIẾN THỂ */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white p-10 rounded-[40px] border border-zinc-100 shadow-sm space-y-8">
            <input type="text" placeholder="TÊN SẢN PHẨM..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full text-3xl font-black border-b-2 border-zinc-100 py-3 outline-none focus:border-black uppercase tracking-tighter" required />
            <div className="grid grid-cols-2 gap-6">
              <input type="number" placeholder="GIÁ GỐC (Đ)..." value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-zinc-50 rounded-2xl p-4 font-black outline-none border border-transparent focus:border-black transition-all" required />
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-zinc-50 rounded-2xl p-4 font-black outline-none border border-transparent focus:border-black transition-all" required>
                <option value="">DANH MỤC</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <textarea placeholder="MÔ TẢ SẢN PHẨM..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-zinc-50 rounded-[32px] p-6 h-32 outline-none border border-transparent focus:border-black text-sm font-medium" required />
          </div>

          <div className="bg-black p-8 rounded-[40px] text-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black uppercase tracking-[4px]">Biến thể & Kho</h3>
              <button type="button" onClick={() => setFormData({...formData, variants: [...formData.variants, {size: '', color: '', stock: 0, price: ''}]})} className="text-[9px] bg-white text-black px-4 py-2 rounded-full font-black uppercase">+ Thêm dòng</button>
            </div>
            <div className="space-y-3">
              {formData.variants.map((v, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
                  <select value={v.size} onChange={e => handleVariantChange(index, 'size', e.target.value)} className="col-span-3 bg-transparent text-xs font-black uppercase outline-none">
                    <option value="">Size</option>
                    {AVAILABLE_SIZES.map(s => <option className="text-black" key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={v.color} onChange={e => handleVariantChange(index, 'color', e.target.value)} className="col-span-3 bg-transparent text-xs font-black uppercase outline-none border-l border-zinc-700 pl-2">
                    <option value="">Màu</option>
                    {AVAILABLE_COLORS.map(c => <option className="text-black" key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="number" placeholder="Kho" value={v.stock} onChange={e => handleVariantChange(index, 'stock', e.target.value)} className="col-span-2 bg-transparent text-xs font-black outline-none border-l border-zinc-700 pl-2" />
                  <input type="number" placeholder="Giá riêng" value={v.price} onChange={e => handleVariantChange(index, 'price', e.target.value)} className="col-span-3 bg-transparent text-[10px] outline-none border-l border-zinc-700 pl-2" />
                  <button type="button" onClick={() => setFormData({...formData, variants: formData.variants.filter((_, i) => i !== index)})} className="col-span-1 text-zinc-600 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-red-600 text-white py-6 rounded-[32px] font-black uppercase tracking-[4px] hover:bg-black transition-all">
            {loading ? 'Đang tạo...' : 'Tạo sản phẩm ngay'}
          </button>
        </div>
      </form>
    </div>
  );
};