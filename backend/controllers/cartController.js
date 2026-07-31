const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * Hàm Helper: Tính toán lại tổng tiền và số lượng
 * Giúp code gọn gàng và tránh sai sót giữa các hàm
 */
const calculateCartTotals = (items) => {
  let totalPrice = 0;
  let totalQuantity = 0;

  items.forEach((item) => {
    if (item && item.product && item.product.isDeleted !== true) { 
      totalPrice += (item.product.price || 0) * item.quantity;
      totalQuantity += item.quantity;
    }
  });

  return { totalPrice, totalQuantity };
};

// 1. THÊM VÀO GIỎ
const addToCart = async (req, res) => {
  // 1. Khởi tạo phiên làm việc (Session) và Bắt đầu Giao dịch
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, quantity = 1, size, color } = req.body;
    const userId = req.user._id;

    // 2. Ném lỗi thay vì return để nhảy thẳng xuống catch 
    if (!productId || !size || !color) {
      throw { status: 400, message: 'Thiếu thông tin sản phẩm' };
    }

    // 3. Gắn `.session(session)` vào mọi thao tác ĐỌC dữ liệu
    const product = await Product.findById(productId).session(session);
    if (!product) throw { status: 404, message: 'Sản phẩm không tồn tại' };
    if (quantity > product.stock) throw { status: 400, message: 'Vượt quá hàng tồn kho' };

    let cart = await Cart.findOne({ user: userId }).session(session);

    if (!cart) {
      cart = new Cart({ user: userId, items: [{ product: productId, quantity, size, color }] });
    } else {
      const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId && item.size === size && item.color === color
      );

      if (existingItemIndex > -1) {
        const newQty = cart.items[existingItemIndex].quantity + quantity;
        if (newQty > product.stock) throw { status: 400, message: 'Vượt quá hàng tồn kho' };
        cart.items[existingItemIndex].quantity = newQty;
      } else {
        cart.items.push({ product: productId, quantity, size, color });
      }
    }

    // 4. Gắn `{ session }` vào thao tác GHI dữ liệu
    await cart.save({ session });

    // 5. CHỐT GIAO DỊCH: Lưu vĩnh viễn vào Database
    await session.commitTransaction();
    session.endSession();

    // 6. Sau khi DB đã an toàn, mới Query lại để lấy data đầy đủ (Populate) trả về cho Frontend
    // Đoạn này nằm ngoài Transaction vì chỉ là thao tác đọc dữ liệu đã an toàn
    const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price images mainImage');
    const { totalPrice, totalQuantity } = calculateCartTotals(updatedCart.items);

    return res.status(201).json({
      success: true,
      message: 'Đã thêm vào giỏ hàng',
      data: { _id: updatedCart._id, items: updatedCart.items, totalPrice, totalQuantity },
    });

  } catch (error) {
    // 7. CÓ LỖI XẢY RA: Hủy bỏ toàn bộ thao tác nãy giờ 
    await session.abortTransaction();
    session.endSession();

    const statusCode = error.status || 500;
    const errorMessage = error.status ? error.message : 'Lỗi server';
    
    return res.status(statusCode).json({ success: false, message: errorMessage });
  }
};

// 2. LẤY GIỎ HÀNG 
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    // Populate để lấy thông tin sản phẩm
    let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price images mainImage');
    if (!cart) return res.status(200).json({ success: true, data: { items: [] } });

    // Tính toán lại tổng tiền 
    const { totalPrice, totalQuantity } = calculateCartTotals(cart.items);

    return res.status(200).json({
      success: true,
      data: {
        _id: cart._id,
        items: cart.items,
        totalPrice,
        totalQuantity
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 3. CẬP NHẬT SỐ LƯỢNG 
const updateQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;

    if (!quantity || quantity < 1) return res.status(400).json({ success: false, message: 'Số lượng không hợp lệ' });

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Giỏ hàng không tồn tại' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Sản phẩm không có trong giỏ' });

    const product = await Product.findById(item.product);
    if (quantity > product.stock) return res.status(400).json({ success: false, message: 'Vượt quá hàng tồn kho' });

    item.quantity = quantity;
    await cart.save();

    //  Lấy lại giỏ hàng và tính toán lại tổng tiền để trả về cho FE
    const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price images mainImage');
    const { totalPrice, totalQuantity } = calculateCartTotals(updatedCart.items);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thành công',
      data: { _id: updatedCart._id, items: updatedCart.items, totalPrice, totalQuantity },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật' });
  }
};

// 4. XÓA 1 MÓN KHỎI GIỎ
const removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Giỏ hàng không tồn tại' });

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price images mainImage');
    const { totalPrice, totalQuantity } = calculateCartTotals(updatedCart.items);

    return res.status(200).json({
      success: true,
      message: 'Đã xóa sản phẩm',
      data: { _id: updatedCart._id, items: updatedCart.items, totalPrice, totalQuantity },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi xóa sản phẩm' });
  }
};

// 5. XÓA SẠCH GIỎ
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId });
    
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Giỏ hàng đã trống',
      data: { items: [], totalPrice: 0, totalQuantity: 0 },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi xóa giỏ hàng' });
  }
};

module.exports = { addToCart, getCart, updateQuantity, removeItem, clearCart };