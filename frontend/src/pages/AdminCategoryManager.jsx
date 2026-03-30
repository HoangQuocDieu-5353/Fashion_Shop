import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

/**
 * AdminCategoryManager - Trang quản lý danh mục cho Admin
 * Gồm: Danh sách danh mục, Form thêm/sửa danh mục
 */
export const AdminCategoryManager = () => {
  // ===== STATE QUẢN LÝ DANH SÁCH DANH MỤC =====
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // ===== STATE QUẢN LÝ FORM =====
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // ===== FETCH DỮ LIỆU KHỞI TẠO =====
  useEffect(() => {
    fetchCategories();
  }, []);

  /**
   * Lấy danh sách danh mục từ API
   */
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh mục:', error);
      toast.error('Lỗi tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  // ===== XỬ LÝ FORM =====

  /**
   * Reset form về trạng thái ban đầu
   */
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
    setEditingCategory(null);
  };

  /**
   * Mở modal để thêm danh mục mới
   */
  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  /**
   * Mở modal để sửa danh mục
   */
  const handleOpenEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
    });
    setIsModalOpen(true);
  };

  /**
   * Đóng modal
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  /**
   * Xử lý thay đổi input text
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Gửi form (Thêm hoặc Sửa danh mục)
   */
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    // Kiểm tra validation
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Vui lòng nhập mô tả danh mục');
      return;
    }

    try {
      setLoading(true);

      let response;
      if (editingCategory) {
        // Cập nhật danh mục
        response = await axiosInstance.put(`/categories/${editingCategory._id}`, {
          name: formData.name,
          description: formData.description,
        });
      } else {
        // Tạo danh mục mới
        response = await axiosInstance.post('/categories', {
          name: formData.name,
          description: formData.description,
        });
      }

      if (response.data.success) {
        toast.success(
          editingCategory ? 'Cập nhật danh mục thành công' : 'Thêm danh mục thành công'
        );
        handleCloseModal();
        fetchCategories();
      }
    } catch (error) {
      console.error('Lỗi khi lưu danh mục:', error);
      const message = error.response?.data?.message || 'Lỗi khi lưu danh mục';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Xóa danh mục với xác nhận
   */
  const handleDeleteCategory = async (categoryId) => {
    // Hiển thị hộp thoại xác nhận
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa danh mục này?');
    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await axiosInstance.delete(`/categories/${categoryId}`);
      if (response.data.success) {
        toast.success('Xóa danh mục thành công');
        fetchCategories();
      }
    } catch (error) {
      console.error('Lỗi khi xóa danh mục:', error);
      const message = error.response?.data?.message || 'Lỗi khi xóa danh mục';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format ngày tháng
   */
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  // ===== RENDER JSX =====

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold"> Quản Lý Danh Mục</h1>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          <Plus size={20} /> Thêm Danh Mục
        </button>
      </div>

      {/* Danh sách danh mục - Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading && !categories.length ? (
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : categories.length === 0 ? (
          // Không có danh mục
          <div className="flex flex-col items-center justify-center h-80 gap-4">
            <AlertCircle size={64} className="text-gray-400" />
            <p className="text-2xl font-bold text-gray-400">Không có danh mục</p>
          </div>
        ) : (
          <table className="w-full">
            {/* Header Table */}
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Tên Danh Mục</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Mô Tả</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Ngày Tạo</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Thao Tác</th>
              </tr>
            </thead>

            {/* Body Table */}
            <tbody>
              {categories.map((category) => (
                <tr key={category._id} className="border-b hover:bg-gray-50 transition">
                  {/* Tên danh mục */}
                  <td className="px-6 py-3">
                    <p className="font-semibold text-gray-800 truncate">{category.name}</p>
                  </td>

                  {/* Mô tả */}
                  <td className="px-6 py-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {category.description || 'N/A'}
                    </p>
                  </td>

                  {/* Ngày tạo */}
                  <td className="px-6 py-3">
                    <p className="text-sm text-gray-600">{formatDate(category.createdAt)}</p>
                  </td>

                  {/* Thao tác */}
                  <td className="px-6 py-3 flex justify-center gap-3">
                    <button
                      onClick={() => handleOpenEditModal(category)}
                      className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition text-sm font-semibold"
                      title="Sửa danh mục"
                    >
                      <Edit2 size={16} /> Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id)}
                      className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition text-sm font-semibold"
                      title="Xóa danh mục"
                    >
                      <Trash2 size={16} /> Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== MODAL FORM THÊM/SỬA DANH MỤC ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            {/* Modal Header */}
            <div className="border-b flex justify-between items-center p-6">
              <h2 className="text-2xl font-bold">
                {editingCategory ? '✏️ Sửa Danh Mục' : '➕ Thêm Danh Mục Mới'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body - Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-6">
              {/* Tên danh mục */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Danh Mục *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nhập tên danh mục (ví dụ: Áo nam, Quần nữ)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  required
                />
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô Tả *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Nhập mô tả danh mục"
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  required
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 justify-end border-t pt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {loading
                    ? ' Đang lưu...'
                    : editingCategory
                    ? 'Cập Nhật'
                    : 'Thêm Danh Mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
