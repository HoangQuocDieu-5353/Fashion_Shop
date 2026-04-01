const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const path = require('path'); 
const socketIo = require('socket.io');
const connectDB = require('./configs/db');

// --- IMPORT ROUTES ---
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const refundRoutes = require('./routes/refundRoutes'); // 🚀 1. Thêm import Refund Route
const bannerRoutes = require('./routes/bannerRoutes'); // 🚀 2. Thêm import Banner Route
const { initializeSocket } = require('./utils/socketHandler');

dotenv.config();
connectDB();

const app = express();

const corsOptions = {
  origin: [
    'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174',
    'http://127.0.0.1:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174',
  ],
  credentials: true,               
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const server = http.createServer(app);
const io = socketIo(server, { cors: corsOptions });
global.io = io;
initializeSocket(io);

// --- MIDDLEWARES ---
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/**
 * 📂 CẤU HÌNH THƯ MỤC TĨNH (STATIC)
 * Dùng path.resolve để đảm bảo dù ông chạy server ở đâu thì nó cũng trỏ đúng vào thư mục uploads ở gốc dự án
 */
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// --- ROUTES API ---
app.use('/api/auth', authRoutes);           
app.use('/api/users', userRoutes);          
app.use('/api/categories', categoryRoutes); 
app.use('/api/products', productRoutes);    
app.use('/api/carts', cartRoutes);          
app.use('/api/orders', orderRoutes);        
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/refunds', refundRoutes); 
app.use('/api/banners', bannerRoutes);
app.get('/', (req, res) => {
    res.send('Backend Fashion Shop đang chạy cực mượt trên Local! Đã có 12 Models!');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server: http://localhost:${PORT}`);
});