const Product = require('../models/Product');

/**
 * Hàm helper để xử lý ảnh từ 2 nguồn: multer (file upload) và req.body.images (URL)
 * @param {Array} files - Danh sách file từ multer (req.files)
 * @param {String|Array} bodyImages - Danh sách URL ảnh từ request body
 * @returns {Array} - Mảng chứa đường dẫn ảnh cuối cùng
 */
const processImages = (files, bodyImages) => {
  // Tạo mảng ảnh cuối cùng
  let finalImages = [];

  // Nếu có file upload từ multer, thêm đường dẫn /uploads/filename
  if (files && Array.isArray(files) && files.length > 0) {
    const uploadedImages = files.map((file) => `/uploads/${file.filename}`);
    finalImages = [...finalImages, ...uploadedImages];
  }

  // Nếu người dùng gửi danh sách URL ảnh từ req.body.images
  if (bodyImages) {
    let bodyImageArray = [];

    // Kiểm tra nếu bodyImages là chuỗi JSON, thì parse nó
    if (typeof bodyImages === 'string') {
      try {
        // Thử parse như JSON array
        bodyImageArray = JSON.parse(bodyImages);
        if (!Array.isArray(bodyImageArray)) {
          // Nếu parse ra không phải array, bọc chuỗi vào mảng
          bodyImageArray = [bodyImages];
        }
      } catch (e) {
        // Nếu parse thất bại, coi như chuỗi đơn, bọc vào mảng
        bodyImageArray = [bodyImages];
      }
    } else if (Array.isArray(bodyImages)) {
      // Nếu đã là array, giữ nguyên
      bodyImageArray = bodyImages;
    }

    // Gộp các URL từ body vào finalImages
    finalImages = [...finalImages, ...bodyImageArray];
  }

  return finalImages;
};

/**
 * Tạo sản phẩm mới với hỗ trợ upload nhiều ảnh
 * Hỗ trợ cả 2 cách: upload file từ multer hoặc gửi URL ảnh
 * @route POST /api/products
 * @access Public
 */
const createProduct = async (req, res) => {
  try {
    const { name, price, description, category, sizes, colors, stock, mainImage, images: bodyImages } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !price || !description || !category || !sizes || !colors) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        data: null,
      });
    }

    // Xử lý ảnh từ cả 2 nguồn: multer (req.files) và URL (req.body.images)
    const finalImages = processImages(req.files, bodyImages);

    // Tạo sản phẩm mới
    const newProduct = new Product({
      name,
      price: parseFloat(price),
      description,
      category, // category bây giờ là ObjectId tham chiếu tới Category model
      sizes: Array.isArray(sizes) ? sizes : JSON.parse(sizes),
      colors: Array.isArray(colors) ? colors : JSON.parse(colors),
      stock: parseInt(stock) || 0,
      images: finalImages,
      // Nếu người dùng chỉ định mainImage, dùng nó; ngược lại dùng ảnh đầu tiên từ finalImages
      mainImage: mainImage || (finalImages.length > 0 ? finalImages[0] : null),
    });

    // Lưu vào database
    const savedProduct = await newProduct.save();

    // Populate category để trả về đầy đủ thông tin danh mục
    const productWithCategory = await savedProduct.populate('category');

    return res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: productWithCategory,
    });
  } catch (error) {
    console.error('Lỗi khi tạo sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo sản phẩm',
      data: null,
    });
  }
};

/**
 * Lấy danh sách các sản phẩm chưa bị xóa (isDeleted: false)
 * Hỗ trợ tìm kiếm theo name, lọc theo category, lọc theo khoảng giá
 * Query params: name (tìm kiếm), category (filter), minPrice, maxPrice
 * @route GET /api/products
 * @access Public
 */
// backend/src/controllers/productController.js

const getProducts = async (req, res) => {
  try {
    // 🚀 Lấy query params (Đã đồng bộ tên biến với Frontend)
    const { search, category, sort, page = 1, limit = 10 } = req.query;

    const filter = { isDeleted: false };

    // 1. Tìm kiếm theo tên (Live Search logic)
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // 2. Lọc theo category
    if (category && category !== 'All') {
      filter.category = category;
    }

    // 🚀 3. Xử lý Sắp xếp linh hoạt
    let sortOptions = { createdAt: -1 }; // Mặc định: Mới nhất
    if (sort) {
      if (sort === 'price-low') sortOptions = { price: 1 };
      if (sort === 'price-high') sortOptions = { price: -1 };
      if (sort === 'az') sortOptions = { name: 1 };
      if (sort === 'za') sortOptions = { name: -1 };
    }

    // Tính toán phân trang
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12; // Để 12 cho đẹp lưới 3 hoặc 4 cột
    const skip = (pageNum - 1) * limitNum;

    // Thực thi truy vấn
    const products = await Product.find(filter)
      .sort(sortOptions) // 🚀 Gắn logic sắp xếp vào đây
      .skip(skip)
      .limit(limitNum);

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limitNum);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách sản phẩm thành công',
      data: products, // 🚀 Trả về mảng trực tiếp để FE dùng cho lẹ
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalProducts,
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ',
    });
  }
};

/**
 * Lấy chi tiết một sản phẩm theo ID
 * Sử dụng .populate('category') để lấy đầy đủ thông tin danh mục
 * @route GET /api/products/:id
 * @access Public
 */
const getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Tìm sản phẩm theo ID và không phải bị xóa
    // .populate('category') - Lấy đầy đủ thông tin danh mục thay vì chỉ lấy ID
    const product = await Product.findOne({
      _id: id,
      isDeleted: false,
    }).populate('category');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại hoặc đã bị xóa',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết sản phẩm thành công',
      data: product,
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy chi tiết sản phẩm',
      data: null,
    });
  }
};

/**
 * Cập nhật thông tin sản phẩm (hỗ trợ thêm ảnh mới, giữ ảnh cũ)
 * Hỗ trợ cả 2 cách: upload file từ multer hoặc gửi URL ảnh
 * @route PUT /api/products/:id
 * @access Public
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, category, sizes, colors, stock, mainImage, images: bodyImages } = req.body;

    // Tìm sản phẩm hiện tại
    const product = await Product.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại hoặc đã bị xóa',
        data: null,
      });
    }

    // Cập nhật thông tin text nếu được cung cấp
    if (name) product.name = name;
    if (price) product.price = parseFloat(price);
    if (description) product.description = description;
    
    // Cập nhật category - kiểm tra nếu là ObjectId hợp lệ
    if (category) {
      // Kiểm tra xem category có phải ObjectId hợp lệ không
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(category)) {
        product.category = category;
      }
      // Nếu không phải ObjectId, bỏ qua (không update category)
    }
    
    if (sizes) product.sizes = Array.isArray(sizes) ? sizes : JSON.parse(sizes);
    if (colors) product.colors = Array.isArray(colors) ? colors : JSON.parse(colors);
    if (stock !== undefined) product.stock = parseInt(stock);

    // Xử lý ảnh: nếu có ảnh mới, xóa sạch ảnh cũ và thay thế (từ multer hoặc URL)
    const newImages = processImages(req.files, bodyImages);
    
    if (newImages.length > 0) {
      // Nếu có ảnh mới, xóa sạch ảnh cũ và dùng ảnh mới
      product.images = newImages;
    }

    // Cập nhật ảnh chính
    if (mainImage) {
      // Nếu người dùng chỉ định mainImage cụ thể
      product.mainImage = mainImage;
    } else if (!product.mainImage && product.images.length > 0) {
      // Nếu chưa có ảnh chính và có ảnh trong mảng, lấy ảnh đầu tiên
      product.mainImage = product.images[0];
    }

    // Lưu các thay đổi
    const updatedProduct = await product.save();

    // Populate category để trả về đầy đủ thông tin danh mục
    const productWithCategory = await updatedProduct.populate('category');

    return res.status(200).json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: productWithCategory,
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật sản phẩm',
      data: null,
    });
  }
};

/**
 * Xóa mềm sản phẩm - Chuyển trạng thái isDeleted thành true
 * Không xóa thực sự dữ liệu khỏi database
 * @route DELETE /api/products/:id
 * @access Public
 */
const softDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Tìm sản phẩm theo ID
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại',
        data: null,
      });
    }

    // Kiểm tra xem sản phẩm đã bị xóa trước đó hay không
    if (product.isDeleted) {
      return res.status(409).json({
        success: false,
        message: 'Sản phẩm đã bị xóa trước đó',
        data: null,
      });
    }

    // Đánh dấu xóa mềm: cập nhật cờ isDeleted và thời gian xóa
    product.isDeleted = true;
    product.deletedAt = new Date();

    const deletedProduct = await product.save();

    return res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công',
      data: deletedProduct,
    });
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa sản phẩm',
      data: null,
    });
  }
};

// Xuất các controller
module.exports = {
  createProduct,
  getProducts,
  getProductDetail,
  updateProduct,
  softDeleteProduct,
};
