import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Upload, Check } from 'lucide-react';

// 🚀 ĐỊNH NGHĨA BỘ GIÁ TRỊ CHUẨN (Nằm ngoài component)
const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
const AVAILABLE_COLORS = ['Đen', 'Trắng', 'Xám', 'Xanh Navy', 'Đỏ', 'Be', 'Vàng', 'Hồng', 'Xanh Lá'];

export const AdminProductManager = () => {
  const navigate = useNavigate();
  const BASE_URL = "http://localhost:5000";

  // Hàm xử lý URL ảnh
  const getImgUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150';
    if (path.startsWith('blob:')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${BASE_URL}/${cleanPath}`;
  };

  // ===== STATE QUẢN LÝ =====
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '', price: '', description: '', category: '',
    stock: '', sizes: [], colors: [], mainImage: null, secondaryImages: [],
  });

  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [secondaryImagesPreview, setSecondaryImagesPreview] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/products');
      if (response.data.success) {
        const productData = response.data.data.products || response.data.data || [];
        setProducts(Array.isArray(productData) ? productData : []);
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách sản phẩm');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/categories');
      if (response.data.success) setCategories(response.data.data || []);
    } catch (error) {
      setCategories([]);
    }
  };

  // 🚀 HÀM TOGGLE CHỌN SIZE/MÀU (Thêm nếu chưa có, xóa nếu đã có)
  const handleToggleSelect = (type, value) => {
    setFormData(prev => {
      const currentList = prev[type];
      const isExist = currentList.includes(value);
      return {
        ...prev,
        [type]: isExist 
          ? currentList.filter(item => item !== value) 
          : [...currentList, value]
      };
    });
  };

  const resetForm = () => {
    setFormData({
      name: '', price: '', description: '', category: '',
      stock: '', sizes: [], colors: [], mainImage: null, secondaryImages: [],
    });
    setMainImagePreview(null);
    setSecondaryImagesPreview([]);
    setEditingProduct(null);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category?._id || product.category || '',
      stock: product.stock || 0,
      sizes: product.sizes || [],
      colors: product.colors || [],
      mainImage: null,
      secondaryImages: [],
    });
    setMainImagePreview(getImgUrl(product.mainImage));
    setSecondaryImagesPreview(product.images ? product.images.map(img => getImgUrl(img)) : []);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, mainImage: file }));
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSecondaryImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({ ...prev, secondaryImages: files }));
    setSecondaryImagesPreview(files.map(file => URL.createObjectURL(file)));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const fData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'sizes' || key === 'colors') fData.append(key, JSON.stringify(formData[key]));
        else if (key !== 'secondaryImages' && key !== 'mainImage') fData.append(key, formData[key]);
      });

      if (formData.mainImage) fData.append('images', formData.mainImage);
      formData.secondaryImages.forEach((img) => fData.append('images', img));

      const res = editingProduct 
        ? await axiosInstance.put(`/products/${editingProduct._id}`, fData)
        : await axiosInstance.post('/products', fData);

      if (res.data.success) {
        toast.success(editingProduct ? 'Cập nhật thành công' : 'Thêm thành công');
        handleCloseModal();
        fetchProducts();
      }
    } catch (error) {
      toast.error('Lỗi khi lưu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">👕 Quản Lý Sản Phẩm</h1>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition">
          <Plus size={20} /> Thêm Sản Phẩm
        </button>
      </div>

      {/* TABLE DANH SÁCH */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-bold text-gray-600">Ảnh</th>
              <th className="px-6 py-3 text-left font-bold text-gray-600">Tên sản phẩm</th>
              <th className="px-6 py-3 text-left font-bold text-gray-600">Giá</th>
              <th className="px-6 py-3 text-center font-bold text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p) => (
              <tr key={p._id} className="border-b hover:bg-gray-50 transition">
                <td className="px-6 py-3">
                  <img src={getImgUrl(p.mainImage)} alt={p.name} className="w-16 h-16 object-cover rounded-lg border shadow-sm" />
                </td>
                <td className="px-6 py-4 font-medium text-gray-800">{p.name}</td>
                <td className="px-6 py-4 font-bold text-red-600">{p?.price?.toLocaleString('vi-VN')} VNĐ</td>
                <td className="px-6 py-4 flex justify-center gap-3">
                  <button onClick={() => handleOpenEditModal(p)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"><Edit2 size={18} /></button>
                  <button onClick={() => { if(window.confirm('Xóa?')) axiosInstance.delete(`/products/${p._id}`).then(fetchProducts); }} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b flex justify-between p-6 z-10">
              <h2 className="text-2xl font-bold text-gray-800">{editingProduct ? '✏️ Cập Nhật Sản Phẩm' : '➕ Thêm Mới'}</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-black transition"><X size={28} /></button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold block text-gray-700">Ảnh Chính *</label>
                  <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 border-gray-300">
                    <input type="file" onChange={handleMainImageChange} className="hidden" id="mainImage" accept="image/*" />
                    <label htmlFor="mainImage" className="cursor-pointer block">
                      <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                      <span className="text-xs font-bold text-gray-500 uppercase">Chọn ảnh chính</span>
                    </label>
                    {mainImagePreview && <img src={mainImagePreview} className="mt-3 w-full h-40 object-cover rounded-lg border shadow-md" />}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold block text-gray-700">Ảnh Gallery</label>
                  <div className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-gray-50 border-gray-300">
                    <input type="file" multiple onChange={handleSecondaryImagesChange} className="hidden" id="gallery" accept="image/*" />
                    <label htmlFor="gallery" className="cursor-pointer block">
                      <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                      <span className="text-xs font-bold text-gray-500 uppercase">Thêm nhiều ảnh phụ</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {secondaryImagesPreview?.map((src, i) => <img key={i} src={src} className="w-full h-12 object-cover rounded border shadow-sm" />)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold mb-1">Tên Sản Phẩm *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-red-500" required />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold mb-1">Giá (VNĐ) *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-red-500" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Danh Mục *</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-xl outline-none" required>
                    <option value="">-- Chọn danh mục --</option>
                    {categories?.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Tồn Kho</label>
                  <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-xl outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Mô Tả *</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-red-500" required />
              </div>

              {/* 🚀 BỘ CHỌN SIZE & MÀU SẮC MỚI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* CHỌN SIZE */}
                <div>
                  <label className="block text-sm font-black mb-3 text-gray-700 uppercase tracking-widest">Kích thước (Sizes)</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_SIZES.map(size => {
                      const isSelected = formData.sizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleToggleSelect('sizes', size)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 flex items-center gap-1 ${
                            isSelected 
                              ? 'bg-red-600 border-red-600 text-white shadow-lg scale-105' 
                              : 'bg-white border-gray-100 text-gray-400 hover:border-red-200'
                          }`}
                        >
                          {size} {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CHỌN MÀU SẮC */}
                <div>
                  <label className="block text-sm font-black mb-3 text-gray-700 uppercase tracking-widest">Màu sắc (Colors)</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_COLORS.map(color => {
                      const isSelected = formData.colors.includes(color);
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleToggleSelect('colors', color)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 flex items-center gap-1 ${
                            isSelected 
                              ? 'bg-gray-900 border-gray-900 text-white shadow-lg scale-105' 
                              : 'bg-white border-gray-100 text-gray-400 hover:border-gray-900'
                          }`}
                        >
                          {color} {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-end border-t pt-6">
                <button type="button" onClick={handleCloseModal} className="px-8 py-2 border-2 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition">Hủy</button>
                <button type="submit" disabled={loading} className="px-8 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg disabled:opacity-50 transition">
                  {loading ? '⏳ Đang lưu...' : '🚀 Xác Nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};