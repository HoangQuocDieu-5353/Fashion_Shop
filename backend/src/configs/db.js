const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB đã thông suốt: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Lỗi kết nối: ${error.message}`);
        process.exit(1); // Dừng server nếu không kết nối được
    }
};

module.exports = connectDB;