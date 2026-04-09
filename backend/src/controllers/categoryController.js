const Category = require('../models/Category');
const Product = require('../models/Product');
/**
 * Lấy danh sách tất cả danh mục
 * @route GET /api/categories
 * @access Public
 */
const getCategories = async (req, res) => {
  try {
    // Lấy tất cả danh mục sắp xếp theo thời gian tạo giảm dần
    const categories = await Category.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách danh mục thành công',
      data: categories,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách danh mục:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách danh mục',
      data: null,
    });
  }
};

/**
 * Lấy chi tiết một danh mục theo ID
 * @route GET /api/categories/:id
 * @access Public
 */
const getCategoryDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Tìm danh mục theo ID
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết danh mục thành công',
      data: category,
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết danh mục:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy chi tiết danh mục',
      data: null,
    });
  }
};

/**
 * Lấy danh mục theo slug
 * @route GET /api/categories/slug/:slug
 * @access Public
 */
const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Tìm danh mục theo slug
    const category = await Category.findOne({ slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết danh mục thành công',
      data: category,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh mục theo slug:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh mục theo slug',
      data: null,
    });
  }
};

/**
 * Tạo danh mục mới
 * @route POST /api/categories
 * @access Public
 */
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Kiểm tra trường name bắt buộc
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên danh mục',
        data: null,
      });
    }

    // Kiểm tra xem danh mục đã tồn tại hay chưa
    const existingCategory = await Category.findOne({
      name: name.trim(),
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Danh mục này đã tồn tại',
        data: null,
      });
    }

    // Tạo danh mục mới

    const newCategory = new Category({
      name: name.trim(),
      description: description ? description.trim() : '',
    });

    // Lưu vào database - Middleware sẽ tạo slug từ name
    const savedCategory = await newCategory.save();

    return res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công',
      data: savedCategory,
    });
  } catch (error) {
    console.error('Lỗi khi tạo danh mục:', error);

    // Kiểm tra lỗi duplicate key (name hoặc slug)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        success: false,
        message: `Danh mục với ${field} này đã tồn tại`,
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo danh mục',
      data: null,
    });
  }
};

/**
 * Cập nhật danh mục
 * @route PUT /api/categories/:id
 * @access Public
 */
  const updateCategory = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Tìm danh mục theo ID
      const category = await Category.findById(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Danh mục không tồn tại',
          data: null,
        });
      }

      // Cập nhật thông tin nếu được cung cấp
      if (name && name.trim() !== '') {
        // Kiểm tra xem name mới đã bị dùng bởi danh mục khác chưa
        const existingCategory = await Category.findOne({
          name: name.trim(),
          _id: { $ne: id }, 
        });

        if (existingCategory) {
          return res.status(409).json({
            success: false,
            message: 'Danh mục với tên này đã tồn tại',
            data: null,
          });
        }

        category.name = name.trim();
      }

      if (description !== undefined) {
        category.description = description.trim();
      }


      // Lưu các thay đổi - Middleware sẽ cập nhật slug nếu name được thay đổi
      const updatedCategory = await category.save();

      return res.status(200).json({
        success: true,
        message: 'Cập nhật danh mục thành công',
        data: updatedCategory,
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật danh mục:', error);

      // Kiểm tra lỗi duplicate key
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(409).json({
          success: false,
          message: `Danh mục với ${field} này đã tồn tại`,
          data: null,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ khi cập nhật danh mục',
        data: null,
      });
    }
  };

/**
 * Xóa danh mục
 * @route DELETE /api/categories/:id
 * @access Public
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const hasProducts = await Product.findOne({ category: id, isDeleted: false });
    if (hasProducts) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa! Đang có sản phẩm thuộc danh mục này. Vui lòng chuyển sản phẩm sang danh mục khác trước khi xóa.',
        data: null,
      });
    }

    // Nếu an toàn (không có sản phẩm nào) thì mới cho xóa
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
    }

    return res.status(200).json({ success: true, message: 'Xóa danh mục thành công' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xóa danh mục' });
  }
};

// Xuất các controller
module.exports = {
  getCategories,
  getCategoryDetail,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
