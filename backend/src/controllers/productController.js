const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Inventory = require('../models/Inventory');
const User = require('../models/User'); // 🚀 Thêm để lấy danh sách khách hàng
const { createNotification } = require('../utils/notificationHelper');

/**
 * Hàm tạo Slug tự động từ tên (Ví dụ: "Áo Polo Đen" -> "ao-polo-den")
 */
const generateSlug = (text) => {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/[^a-z0-9 -]/g, '') // Bỏ ký tự đặc biệt
    .replace(/\s+/g, '-') // Thay khoảng trắng bằng dấu gạch ngang
    .replace(/-+/g, '-'); // Gộp nhiều gạch ngang thành 1
};

/**
 * Hàm helper xử lý ảnh (Giữ nguyên tinh hoa của ông giáo)
 */
const processImages = (files, bodyImages) => {
  let finalImages = [];
  if (files && Array.isArray(files) && files.length > 0) {
    const uploadedImages = files.map((file) => `/uploads/${file.filename}`);
    finalImages = [...finalImages, ...uploadedImages];
  }
  if (bodyImages) {
    let bodyImageArray = [];
    if (typeof bodyImages === 'string') {
      try {
        bodyImageArray = JSON.parse(bodyImages);
        if (!Array.isArray(bodyImageArray)) bodyImageArray = [bodyImages];
      } catch (e) {
        bodyImageArray = [bodyImages];
      }
    } else if (Array.isArray(bodyImages)) {
      bodyImageArray = bodyImages;
    }
    finalImages = [...finalImages, ...bodyImageArray];
  }
  return finalImages;
};

/**
 * 🚀 TẠO SẢN PHẨM MỚI (ĐẠI TÚ KIẾN TRÚC 3 BẢNG)
 */
const createProduct = async (req, res) => {
  try {
    const { name, price, description, category, images: bodyImages, variants: bodyVariants } = req.body;

    if (!name || !price || !description || !category || !bodyVariants) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc và biến thể' });
    }

    // Xử lý ảnh
    const finalImages = processImages(req.files, bodyImages);

    // Xử lý biến thể (Parse JSON nếu FE gửi qua FormData)
    let parsedVariants = [];
    if (typeof bodyVariants === 'string') {
      try { parsedVariants = JSON.parse(bodyVariants); } 
      catch (e) { return res.status(400).json({ success: false, message: 'Định dạng variants không hợp lệ' }); }
    } else {
      parsedVariants = bodyVariants;
    }

    // 1. TẠO VỎ SẢN PHẨM (PRODUCT)
    const baseSlug = generateSlug(name);
    // Thêm timestamp nhỏ vào slug để tránh trùng lặp 100% nếu tạo trùng tên
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-5)}`; 

    const newProduct = await Product.create({
      name,
      slug: uniqueSlug,
      price: parseFloat(price),
      description,
      category,
      images: finalImages
    });

    // 2. TẠO BIẾN THỂ (VARIANT) & KHO (INVENTORY)
    const createdVariants = [];
    for (const item of parsedVariants) {
      // Tự sinh SKU: slug-mausac-size
      const skuSlug = generateSlug(`${name}-${item.color}-${item.size}`);
      const sku = skuSlug.toUpperCase();

      // 2.1 Tạo Variant
      const newVariant = await ProductVariant.create({
        product: newProduct._id,
        sku: sku,
        size: item.size,
        color: item.color,
        price: item.price ? parseFloat(item.price) : null,
      });

      // 2.2 Khởi tạo tồn kho cho Variant này
      await Inventory.create({
        variant: newVariant._id,
        stock: parseInt(item.stock) || 0,
        reserved: 0,
        stockCount: 0
      });

      createdVariants.push(newVariant);
    }

    return res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm và thiết lập kho thành công',
      data: {
        product: newProduct,
        variantsCount: createdVariants.length
      },
    });
  } catch (error) {
    console.error('Lỗi khi tạo sản phẩm:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Lỗi trùng mã SKU hoặc Đường dẫn!' });
    }
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo sản phẩm' });
  }
};

/**
 * 🚀 LẤY DANH SÁCH SẢN PHẨM (DÀNH CHO TRANG CHỦ / TÌM KIẾM)
 */
const getProducts = async (req, res) => {
  try {
    const { search, category, sort, page = 1, limit = 10 } = req.query;
    const filter = { isDeleted: false };

    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category && category !== 'All') filter.category = category;

    let sortOptions = { createdAt: -1 };
    if (sort === 'price-low') sortOptions = { price: 1 };
    if (sort === 'price-high') sortOptions = { price: -1 };
    if (sort === 'az') sortOptions = { name: 1 };
    if (sort === 'za') sortOptions = { name: -1 };

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const skip = (pageNum - 1) * limitNum;

    // 1. TÌM SẢN PHẨM GỐC (DẸP POPULATE VARIANTS)
    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean(); // .lean() cực kỳ quan trọng để mình gán thêm data ở dưới

    // 2. GỘP THỦ CÔNG: TỰ ĐI TÌM VARIANTS VÀ STOCK CHO TỪNG SẢN PHẨM
    const productsWithData = await Promise.all(products.map(async (product) => {
      // Tìm tất cả variants của sản phẩm này
      const variants = await ProductVariant.find({ product: product._id }).lean();
      
      // Lấy thông tin Tồn kho (Inventory) cho từng Variant (Y hệt getProductDetail)
      const variantsWithStock = await Promise.all(variants.map(async (variant) => {
        const inventory = await Inventory.findOne({ variant: variant._id }).lean();
        return {
          ...variant,
          stock: inventory ? inventory.stock : 0,
          sold: inventory ? inventory.stockCount : 0
        };
      }));

      // Gắn variants vào object product
      product.variants = variantsWithStock;
      return product;
    }));

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limitNum);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách sản phẩm thành công',
      data: productsWithData, // 🚀 TRẢ VỀ DATA ĐÃ GỘP TAY
      pagination: { currentPage: pageNum, totalPages, totalProducts },
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

/**
 * 🚀 LẤY CHI TIẾT SẢN PHẨM (KÈM TOÀN BỘ BIẾN THỂ VÀ TỒN KHO)
 */
const getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Tìm Sản phẩm gốc
    const product = await Product.findOne({ _id: id, isDeleted: false }).populate('category').lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại hoặc đã bị xóa' });
    }

    // 2. Tìm tất cả các Variants của Sản phẩm này
    const variants = await ProductVariant.find({ product: product._id }).lean();

    // 3. Lấy thông tin Tồn kho (Inventory) cho từng Variant
    const variantsWithStock = await Promise.all(variants.map(async (variant) => {
      const inventory = await Inventory.findOne({ variant: variant._id }).lean();
      return {
        ...variant,
        stock: inventory ? inventory.stock : 0,
        sold: inventory ? inventory.stockCount : 0
      };
    }));

    // Gắn variants vào object product trả về cho Frontend dễ render
    product.variants = variantsWithStock;

    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết sản phẩm thành công',
      data: product,
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy chi tiết sản phẩm' });
  }
};

/**
 * 🚀 CẬP NHẬT SẢN PHẨM CƠ BẢN
 * (Lưu ý: Chỉ cập nhật Vỏ Product. Việc quản lý thêm/xóa Variant nên làm ở API riêng)
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, category, images: bodyImages } = req.body;

    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    if (name) {
        product.name = name;
        // Nếu muốn đổi tên thì đổi luôn Slug cho chuẩn SEO
        product.slug = `${generateSlug(name)}-${Date.now().toString().slice(-5)}`;
    }
    if (price) product.price = parseFloat(price);
    if (description) product.description = description;
    
    if (category) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(category)) product.category = category;
    }
    
    const newImages = processImages(req.files, bodyImages);
    if (newImages.length > 0) {
      product.images = newImages;
    }

    const updatedProduct = await product.save();
    const productWithCategory = await updatedProduct.populate('category');

    return res.status(200).json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: productWithCategory,
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật sản phẩm' });
  }
};

/**
 * 🚀 XÓA MỀM SẢN PHẨM
 */
const softDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    if (product.isDeleted) return res.status(409).json({ success: false, message: 'Sản phẩm đã bị xóa trước đó' });

    // Xóa mềm vỏ Product
    product.isDeleted = true;
    // (Tuỳ chọn: Nếu kỹ thì gọi updateMany để soft-delete luôn các bảng ProductVariant liên quan)
    
    const deletedProduct = await product.save();

    return res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công',
      data: deletedProduct,
    });
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xóa sản phẩm' });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductDetail,
  updateProduct,
  softDeleteProduct,
};