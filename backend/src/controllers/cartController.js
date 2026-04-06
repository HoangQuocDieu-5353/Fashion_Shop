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
  try {
    const { productId, quantity = 1, size, color } = req.body;
    const userId = req.user._id;

    if (!productId || !size || !color) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin sản phẩm' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    if (quantity > product.stock) return res.status(400).json({ success: false, message: 'Vượt quá hàng tồn kho' });

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [{ product: productId, quantity, size, color }] });
    } else {
      const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId && item.size === size && item.color === color
      );

      if (existingItemIndex > -1) {
        const newQty = cart.items[existingItemIndex].quantity + quantity;
        if (newQty > product.stock) return res.status(400).json({ success: false, message: 'Vượt quá hàng tồn kho' });
        cart.items[existingItemIndex].quantity = newQty;
      } else {
        cart.items.push({ product: productId, quantity, size, color });
      }
    }

    await cart.save();
    const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price images mainImage');
    const { totalPrice, totalQuantity } = calculateCartTotals(updatedCart.items);

    return res.status(201).json({
      success: true,
      message: 'Đã thêm vào giỏ hàng',
      data: { _id: updatedCart._id, items: updatedCart.items, totalPrice, totalQuantity },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 2. LẤY GIỎ HÀNG (Giữ nguyên logic của ông nhưng dùng Helper cho sạch)
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    // Populate để lấy thông tin sản phẩm
    let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price images mainImage');
    if (!cart) return res.status(200).json({ success: true, data: { items: [] } });

    // Tính toán lại tổng tiền (Hàm tính tổng ở Bước 1 sẽ tự bỏ qua món bị xóa)
    const { totalPrice, totalQuantity } = calculateCartTotals(cart.items);

    return res.status(200).json({
      success: true,
      data: {
        _id: cart._id,
        items: cart.items, // Trả về đủ, món nào bị xóa thì product sẽ là null
        totalPrice,
        totalQuantity
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 3. CẬP NHẬT SỐ LƯỢNG (🚀 FIX LỖI TỔNG TIỀN TẠI ĐÂY)
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

    // 🚀 Lấy lại giỏ hàng và tính toán lại tổng tiền để trả về cho FE
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

// 4. XÓA 1 MÓN (🚀 FIX LỖI TỔNG TIỀN TẠI ĐÂY)
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