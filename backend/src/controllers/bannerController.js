const Banner = require('../models/Banner');
const fs = require('fs'); // Thư viện mặc định của Node.js để xử lý file
const path = require('path');

// 🚀 [GET] Public: Lấy danh sách banner đang hoạt động
exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort('sortOrder')
      .select('-createdAt -updatedAt');
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🚀 [GET] Admin: Lấy tất cả banner
exports.getAllBannersAdmin = async (req, res) => {
  try {
    const data = await Banner.find().sort('sortOrder');
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🚀 [POST] Admin: Tạo mới Banner
exports.createBanner = async (req, res) => {
  try {
    // Kiểm tra xem Multer đã bắt được file chưa
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng upload ảnh banner' });
    }

    const { title, linkUrl, sortOrder, isActive } = req.body;
    
    // Chuẩn hóa đường dẫn ảnh (Chuyển dấu \ thành / để chạy tốt trên mọi OS)
    const imageUrl = `/${req.file.path.replace(/\\/g, '/')}`;

    const newBanner = await Banner.create({
      title,
      imageUrl,
      linkUrl,
      sortOrder: Number(sortOrder) || 0,
      isActive: isActive === 'true' || isActive === true,
    });

    res.status(201).json({ success: true, data: newBanner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🚀 [PATCH] Admin: Cập nhật thông tin
exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Không tìm thấy banner' });

    const updateData = { ...req.body };

    // Nếu có upload ảnh mới
    if (req.file) {
      // 1. Xóa ảnh cũ trên server (Nên làm để tránh rác host)
      const oldPath = path.join(__dirname, '../../', banner.imageUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      // 2. Cập nhật path mới
      updateData.imageUrl = `/${req.file.path.replace(/\\/g, '/')}`;
    }

    // Convert kiểu dữ liệu từ form-data
    if (updateData.sortOrder) updateData.sortOrder = Number(updateData.sortOrder);
    if (updateData.isActive) updateData.isActive = updateData.isActive === 'true' || updateData.isActive === true;

    const updatedBanner = await Banner.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.status(200).json({ success: true, data: updatedBanner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🚀 [DELETE] Admin: Xóa Banner
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    // Xóa file ảnh vật lý trên folder uploads
    const imagePath = path.join(__dirname, '../../', banner.imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await banner.deleteOne();
    res.status(200).json({ success: true, message: 'Đã xóa banner và file ảnh thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};