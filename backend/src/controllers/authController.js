const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

/**
 * Tạo JWT Token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Đăng ký tài khoản mới
 */
const register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu.' });
    }

    // Kiểm tra định dạng Email & SĐT
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: 'Email không đúng định dạng.' });
    if (phone && !phoneRegex.test(phone)) return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ.' });

    // Kiểm tra độ mạnh mật khẩu
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 8-32 ký tự, bao gồm chữ hoa, thường, số và ký tự đặc biệt.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ success: false, message: 'Email này đã được đăng ký.' });

    // Khởi tạo User mới (chưa lưu vội)
    const newUser = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: 'customer', // ✅ Đồng bộ customer
    });

    // 🚀 TẠO TOKEN XÁC THỰC EMAIL
    // Dùng thư viện crypto có sẵn của Node.js
    const verificationToken = crypto.randomBytes(20).toString('hex');
    
    // Mã hóa token trước khi lưu vào DB (bảo mật y chang luồng Quên mật khẩu)
    newUser.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    newUser.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // Hạn 24 giờ

    // Lưu user vào DB (Lúc này isVerified trong Model vẫn đang là false)
    await newUser.save();

    // 🚀 GỬI EMAIL XÁC THỰC
    // Link này trỏ về Frontend. FE bắt route này và gọi API xác thực
    const verifyUrl = `http://localhost:5173/verify-email/${verificationToken}`; 
    
    // Giao diện Email xịn sò một chút
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #000; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px;">Xác thực tài khoản</h2>
        <p>Chào <b>${newUser.fullName}</b>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại <b>Fashion Shop</b>. Để hoàn tất, vui lòng click vào nút bên dưới để xác thực email của bạn:</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 25px; text-decoration: none; font-weight: bold; margin: 20px 0;">XÁC THỰC EMAIL</a>
        <p>Link này sẽ tự động hết hạn sau 24 giờ.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: newUser.email,
        subject: 'Xác thực tài khoản - Fashion Shop',
        html: htmlContent
      });
      
      // Thành công thì trả về message, TUYỆT ĐỐI KHÔNG trả về JWT token để không cho đăng nhập liền
      return res.status(201).json({ 
        success: true, 
        message: 'Đăng ký thành công! Vui lòng kiểm tra hộp thư email để xác thực tài khoản.' 
      });

    } catch (emailError) {
      // Rollback: Xóa user nếu gửi mail lỗi để khách không bị kẹt email đó
      await User.findByIdAndDelete(newUser._id);
      console.error("Lỗi gửi mail xác thực:", emailError);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi hệ thống gửi mail. Vui lòng đăng ký lại sau.' 
      });
    }

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng ký.' });
  }
};

/**
 * Đăng nhập
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Thông tin đăng nhập không chính xác.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Tài khoản hiện đang bị tạm khóa. Vui lòng liên hệ Admin.' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email!' });
    }

    const token = generateToken(user._id, user.role);
    return res.status(200).json({ success: true, message: 'Đăng nhập thành công.', data: { token, user } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập.' });
  }
};

/**
 * 📧 QUÊN MẬT KHẨU (Gửi mail chứa reset token)
 */
const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ success: false, message: 'Địa chỉ email không tồn tại.' });

    // Tạo reset token ngẫu nhiên
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Mã hóa và lưu vào DB kèm thời hạn 10 phút
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Link dẫn tới trang Reset Password ở Frontend
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #000; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px;">Khôi phục mật khẩu</h2>
        <p>Quý khách nhận được email này vì đã yêu cầu đặt lại mật khẩu cho tài khoản tại <b>Fashion Shop</b>.</p>
        <p>Vui lòng nhấn vào nút bên dưới để đổi mật khẩu mới. Liên kết này có hiệu lực trong <b>10 phút</b>.</p>
        <a href="${resetUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 25px; text-decoration: none; font-weight: bold; margin: 20px 0;">ĐẶT LẠI MẬT KHẨU</a>
        <p style="font-size: 11px; color: #888;">Nếu không phải quý khách yêu cầu, vui lòng bỏ qua email này.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Yêu cầu đặt lại mật khẩu - Fashion Shop',
        html: htmlContent
      });
      res.status(200).json({ success: true, message: 'Liên kết khôi phục đã được gửi tới email của quý khách.' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ success: false, message: 'Không thể gửi email lúc này.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 🔑 ĐẶT LẠI MẬT KHẨU (Kiểm tra token và lưu mật khẩu mới)
 */
const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Liên kết không hợp lệ hoặc đã hết hạn.' });

    // Kiểm tra mật khẩu mới có mạnh không
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;
    if (!passwordRegex.test(req.body.password)) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới không đủ mạnh theo quy định.' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Mật khẩu đã được cập nhật thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const verifyEmail = async (req, res) => {
  try {
    // Mã hóa token gửi từ FE lên để so sánh với token đã mã hóa trong DB
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // Tìm user có token này và token chưa hết hạn
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Link xác thực không hợp lệ hoặc đã hết hạn.' });
    }

    // Cập nhật trạng thái xác thực
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Xác thực tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, forgotPassword, resetPassword, verifyEmail };