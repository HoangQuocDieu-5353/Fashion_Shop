import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { X, Upload, ArrowLeft } from 'lucide-react';

/**
 * AdminProductEditor - Trang sửa sản phẩm
 * Lấy sản phẩm theo ID từ URL params
 */
export const AdminProductEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    description: '',
    category: '',
    stock: 0,
    sizes: [],
    colors: [],
    mainImage: null,
    secondaryImages: [],
  });

  const [newSizeInput, setNewSizeInput] = useState('');
  const [newColorInput, setNewColorInput] = useState('');
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [secondaryImagesPreview, setSecondaryImagesPreview] = useState([]);

  // ===== FETCH PRODUCT DETAIL & CATEGORIES =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);

        // Fetch product
        const productRes = await axiosInstance.get(`/products/${id}`);
        if (productRes.data.success && productRes.data.data) {
          const productData = productRes.data.data;
          
          // Đảm bảo category có giá trị hợp lệ
          const categoryId = 
            productData.category && typeof productData.category === 'object' 
              ? productData.category._id 
              : productData.category;

          setProduct(productData);
          setFormData({
            name: productData.name || '',
            price: productData.price || 0,
            description: productData.description || '',
            category: categoryId || '',
            stock: productData.stock || 0,
            sizes: Array.isArray(productData.sizes) ? productData.sizes : [],
            colors: Array.isArray(productData.colors) ? productData.colors : [],
            mainImage: null,
            secondaryImages: [],
          });
          setMainImagePreview(productData.mainImage || null);
          setSecondaryImagesPreview(Array.isArray(productData.images) ? productData.images : []);
        } else {
          toast.error('Không tìm thấy thông tin sản phẩm');
          navigate('/admin/products');
        }

        // Fetch categories
        const catRes = await axiosInstance.get('/categories');
        if (catRes.data.success) {
          setCategories(catRes.data.data);
        }
      } catch (error) {
        console.error('Lỗi tải dữ liệu:', error);
        toast.error('Lỗi tải thông tin sản phẩm');
        navigate('/admin/products');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // ===== FORM HANDLERS =====
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) : value,
    }));
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        mainImage: file,
      }));
      const reader = new FileReader();
      reader.onload = (event) => {
        setMainImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSecondaryImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        secondaryImages: files,
      }));

      Promise.all(
        files.map((file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              resolve(event.target.result);
            };
            reader.readAsDataURL(file);
          });
        })
      ).then((previews) => {
        setSecondaryImagesPreview(previews);
      });
    }
  };

  const handleAddSize = () => {
    if (newSizeInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        sizes: [...prev.sizes, newSizeInput.trim()],
      }));
      setNewSizeInput('');
    }
  };

  const handleRemoveSize = (size) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((s) => s !== size),
    }));
  };

  const handleAddColor = () => {
    if (newColorInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        colors: [...prev.colors, newColorInput.trim()],
      }));
      setNewColorInput('');
    }
  };

  const handleRemoveColor = (color) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c !== color),
    }));
  };

  // ===== SUBMIT FORM =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.description || !formData.category) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (formData.sizes.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 size');
      return;
    }

    if (formData.colors.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 màu');
      return;
    }

    try {
      setLoading(true);

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('stock', formData.stock || 0);
      formDataToSend.append('sizes', JSON.stringify(formData.sizes));
      formDataToSend.append('colors', JSON.stringify(formData.colors));

      // Thêm ảnh chính nếu có chọn ảnh mới
      if (formData.mainImage) {
        formDataToSend.append('images', formData.mainImage);
      }

      // Thêm các ảnh phụ
      formData.secondaryImages.forEach((image) => {
        formDataToSend.append('images', image);
      });

      const response = await axiosInstance.put(`/products/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Cập nhật sản phẩm thành công');
        navigate('/admin/products');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật sản phẩm:', error);
      const message = error.response?.data?.message || 'Lỗi khi cập nhật sản phẩm';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/products')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
        >
          <ArrowLeft size={20} /> Quay lại
        </button>
        <h1 className="text-3xl font-bold">✏️ Sửa Sản Phẩm</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
        {/* Row 1: Tên & Giá */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên Sản Phẩm *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nhập tên sản phẩm"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá (VNĐ) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="Nhập giá"
              min="0"
              step="1000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              required
            />
          </div>
        </div>

        {/* Row 2: Danh mục & Tồn kho */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danh Mục *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              required
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tồn Kho
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              placeholder="Nhập số lượng tồn kho"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Mô tả */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô Tả chi tiết *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Nhập mô tả sản phẩm"
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            required
          />
        </div>

        {/* Sizes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kích Cỡ (Size) *
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newSizeInput}
              onChange={(e) => setNewSizeInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSize()}
              placeholder="Nhập size (ví dụ: S, M, L, XL)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleAddSize}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Thêm
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.sizes.map((size) => (
              <div
                key={size}
                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2"
              >
                {size}
                <button
                  type="button"
                  onClick={() => handleRemoveSize(size)}
                  className="hover:text-blue-900"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Màu Sắc *
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newColorInput}
              onChange={(e) => setNewColorInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddColor()}
              placeholder="Nhập màu (ví dụ: Đen, Trắng, Đỏ)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleAddColor}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
            >
              Thêm
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.colors.map((color) => (
              <div
                key={color}
                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center gap-2"
              >
                {color}
                <button
                  type="button"
                  onClick={() => handleRemoveColor(color)}
                  className="hover:text-purple-900"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Ảnh Chính */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ảnh Chính
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition cursor-pointer">
            <input
              type="file"
              onChange={handleMainImageChange}
              accept="image/*"
              className="hidden"
              id="mainImageInput"
            />
            <label htmlFor="mainImageInput" className="cursor-pointer block">
              <Upload size={40} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                Kéo ảnh hoặc <span className="text-primary font-semibold">chọn tệp</span>
              </p>
            </label>
          </div>

          {mainImagePreview && (
            <div className="mt-4">
              <img
                src={mainImagePreview}
                alt="Main preview"
                className="w-32 h-32 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Ảnh Phụ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ảnh Phụ (Gallery)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition cursor-pointer">
            <input
              type="file"
              onChange={handleSecondaryImagesChange}
              accept="image/*"
              multiple
              className="hidden"
              id="secondaryImagesInput"
            />
            <label htmlFor="secondaryImagesInput" className="cursor-pointer block">
              <Upload size={40} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                Chọn nhiều ảnh cùng lúc (tối đa 5 ảnh)
              </p>
            </label>
          </div>

          {secondaryImagesPreview.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Ảnh đã chọn ({secondaryImagesPreview.length})
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {secondaryImagesPreview.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Secondary ${index}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 justify-end border-t pt-6">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? '⏳ Đang lưu...' : 'Cập Nhật'}
          </button>
        </div>
      </form>
    </div>
  );
};
