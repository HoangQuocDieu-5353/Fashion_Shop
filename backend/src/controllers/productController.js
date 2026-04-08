const mongoose = require('mongoose');
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
 * Hàm helper xử lý ảnh kết hợp giữa file upload (req.files) và ảnh gửi qua body (body.images)
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
  // 1. Khởi tạo session
  const session = await mongoose.startSession();
  
  try {
    let result = null;

    // 2. Chạy toàn bộ logic trong withTransaction
    await session.withTransaction(async () => {
      const { name, price, description, category, images: bodyImages, variants: bodyVariants } = req.body;

      if (!name || !price || !description || !category || !bodyVariants) {
        throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc và biến thể');
      }

      const finalImages = processImages(req.files, bodyImages);
      let parsedVariants = typeof bodyVariants === 'string' ? JSON.parse(bodyVariants) : bodyVariants;

      // --- BƯỚC 1: TẠO VỎ SẢN PHẨM ---
      const baseSlug = generateSlug(name);
      const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-5)}`;

      // LƯU Ý: Cú pháp .create khi dùng session phải là mảng: [data], { session }
      const [newProduct] = await Product.create([{
        name,
        slug: uniqueSlug,
        price: parseFloat(price),
        description,
        category,
        images: finalImages
      }], { session });

      // --- BƯỚC 2: TẠO BIẾN THỂ & KHO ---
      const createdVariants = [];
      for (const item of parsedVariants) {
        const sku = generateSlug(`${name}-${item.color}-${item.size}`).toUpperCase();

        // Tạo Variant
        const [newVariant] = await ProductVariant.create([{
          product: newProduct._id,
          sku: sku,
          size: item.size,
          color: item.color,
          price: item.price ? parseFloat(item.price) : null,
        }], { session });

        // Khởi tạo tồn kho
        await Inventory.create([{
          variant: newVariant._id,
          stock: parseInt(item.stock) || 0,
          reserved: 0,
          stockCount: 0
        }], { session });

        createdVariants.push(newVariant);
      }

      // Gán dữ liệu để trả về sau khi commit thành công
        result = {
          product: newProduct,
          variantsCount: createdVariants.length
        };
      });

    // Nếu đến đây nghĩa là Transaction đã COMMIT thành công
    return res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm và thiết lập kho thành công',
      data: result
    });

  } catch (error) {
    console.error('Lỗi khi tạo sản phẩm (Transaction aborted):', error);
    
    // Xử lý lỗi trùng SKU/Slug (Lỗi 11000 của MongoDB)
    if (error.code === 11000 || error.message.includes('E11000')) {
      return res.status(400).json({ success: false, message: 'Lỗi trùng mã SKU hoặc Đường dẫn!' });
    }

    return res.status(500).json({ success: false, message: error.message || 'Lỗi máy chủ khi tạo sản phẩm' });
  } finally {
    // 3. Kết thúc session
    await session.endSession();
  }
};

/**
 * 🚀 LẤY DANH SÁCH SẢN PHẨM (DÀNH CHO TRANG CHỦ / TÌM KIẾM)
 */
const getProducts = async (req, res) => {
  try {
    const { search, category, sort, page = 1, limit = 12 } = req.query;
    
    // Tạo bộ lọc filter
    const matchFilter = { isDeleted: false };
    if (search) matchFilter.name = { $regex: search, $options: 'i' };
    if (category && category !== 'All') {
        const mongoose = require('mongoose');
        matchFilter.category = new mongoose.Types.ObjectId(category);
    }

    // Xử lý Sort
    let sortStage = { createdAt: -1 };
    if (sort === 'price-low') sortStage = { price: 1 };
    if (sort === 'price-high') sortStage = { price: -1 };

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const skip = (pageNum - 1) * limitNum;

    const productsWithData = await Product.aggregate([
      { $match: matchFilter }, // 1. Lọc sản phẩm
      { $sort: sortStage },    // 2. Sắp xếp
      { $skip: skip },         // 3. Phân trang
      { $limit: limitNum },
      
      // 4. JOIN với bảng ProductVariant
      {
        $lookup: {
          from: 'productvariants', // Tên collection của ProductVariant
          localField: '_id',
          foreignField: 'product',
          as: 'variants',
          pipeline: [
            // 5. Trong mỗi Variant, JOIN tiếp với bảng Inventory
            {
              $lookup: {
                from: 'inventories', // Tên collection của Inventory
                localField: '_id',
                foreignField: 'variant',
                as: 'stockInfo'
              }
            },
            // Làm phẳng mảng stockInfo và tính toán giá
            {
              $addFields: {
                inventory: { $arrayElemAt: ['$stockInfo', 0] }
              }
            },
            {
              $addFields: {
                stock: { $ifNull: ['$inventory.stock', 0] },
                sold: { $ifNull: ['$inventory.stockCount', 0] }
              }
            },
            { $project: { stockInfo: 0, inventory: 0 } } // Dọn dẹp rác
          ]
        }
      },
      
      // 6. JOIN với Category để lấy tên danh mục
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryDetail'
        }
      },
      { $addFields: { category: { $arrayElemAt: ['$categoryDetail', 0] } } }
    ]);

    const totalProducts = await Product.countDocuments(matchFilter);

    return res.status(200).json({
      success: true,
      data: productsWithData,
      pagination: {
        totalProducts,
        totalPages: Math.ceil(totalProducts / limitNum),
        currentPage: pageNum
      }
    });
  } catch (error) {
    console.error('Lỗi Aggregate:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
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
        price: variant.price || product.price,
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
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { id } = req.params;
      const { name, price, description, category, images: bodyImages, variants: bodyVariants } = req.body;

      // 1. TÌM SẢN PHẨM GỐC (Sử dụng .session)
      const product = await Product.findOne({ _id: id, isDeleted: false }).session(session);
      if (!product) throw new Error('Sản phẩm không tồn tại hoặc đã bị xóa');

      const isNameChanged = name && name !== product.name;

      // --- BƯỚC 1: CẬP NHẬT VỎ SẢN PHẨM ---
      if (name) {
        product.name = name;
        product.slug = `${generateSlug(name)}-${Date.now().toString().slice(-5)}`;
      }
      if (price) product.price = parseFloat(price);
      if (description) product.description = description;
      if (category) product.category = category;

      const newImages = processImages(req.files, bodyImages);
      if (newImages.length > 0) product.images = newImages;

      await product.save({ session });

      // Nếu đổi tên -> Phải đồng bộ lại SKU cho tất cả các Variant cũ TRƯỚC KHI xử lý mảng variants gửi lên
      if (isNameChanged) {
        const existingAll = await ProductVariant.find({ product: id }).session(session);
        for (const v of existingAll) {
          v.sku = generateSlug(`${product.name}-${v.color}-${v.size}`).toUpperCase();
          await v.save({ session });
        }
      }

      // --- BƯỚC 2: XỬ LÝ BIẾN THỂ (VARIANTS) ---
      if (bodyVariants) {
        const parsedVariants = typeof bodyVariants === 'string' ? JSON.parse(bodyVariants) : bodyVariants;

        // Lấy danh sách ID hiện có trong DB
        const currentVariantsInDB = await ProductVariant.find({ product: id }).session(session);
        const currentIds = currentVariantsInDB.map(v => v._id.toString());
        
        // Lấy danh sách ID gửi lên từ Frontend
        const incomingIds = parsedVariants.filter(v => v._id).map(v => v._id.toString());

        // A. XÓA các biến thể không còn nằm trong danh sách gửi lên
        const idsToDelete = currentIds.filter(oldId => !incomingIds.includes(oldId));
        if (idsToDelete.length > 0) {
          await ProductVariant.deleteMany({ _id: { $in: idsToDelete } }, { session });
          await Inventory.deleteMany({ variant: { $in: idsToDelete } }, { session });
        }

        // B. CẬP NHẬT HOẶC THÊM MỚI
        for (const item of parsedVariants) {
          const sku = generateSlug(`${product.name}-${item.color}-${item.size}`).toUpperCase();

          if (item._id) {
            // --- TRƯỜNG HỢP: CẬP NHẬT BIẾN THỂ CŨ ---
            await ProductVariant.findByIdAndUpdate(
              item._id,
              {
                size: item.size,
                color: item.color,
                price: item.price ? parseFloat(item.price) : null,
                sku
              },
              { session }
            );

            if (item.stock !== undefined) {
              await Inventory.findOneAndUpdate(
                { variant: item._id },
                { stock: parseInt(item.stock) },
                { session }
              );
            }
          } else {
            // --- TRƯỜNG HỢP: THÊM BIẾN THỂ MỚI HOÀN TOÀN ---
            // Lưu ý: create trả về mảng khi dùng session
            const [newVariant] = await ProductVariant.create([{
              product: id,
              sku,
              size: item.size,
              color: item.color,
              price: item.price ? parseFloat(item.price) : null
            }], { session });

            await Inventory.create([{
              variant: newVariant._id,
              stock: parseInt(item.stock) || 0,
              reserved: 0,
              stockCount: 0
            }], { session });
          }
        }
      }
    });

    return res.status(200).json({ success: true, message: 'Cập nhật sản phẩm và biến thể thành công' });

  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm (Transaction aborted):', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Lỗi máy chủ khi cập nhật sản phẩm' 
    });
  } finally {
    await session.endSession();
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