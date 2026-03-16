const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

dotenv.config();

const seedDatabase = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Kết nối MongoDB thành công');

    // Kiểm tra nếu admin đã tồn tại
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin đã tồn tại trong database');
      process.exit(0);
    }

    // Tạo tài khoản admin
    const admin = new User({
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      phone: '0123456789',
      role: 'admin',
    });

    await admin.save();
    console.log('✅ Tài khoản admin đã được tạo:');
    console.log('   Email: admin@example.com');
    console.log('   Password: password123');
    console.log('   Role: admin');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
