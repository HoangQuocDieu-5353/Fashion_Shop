const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs'); 
const socketIo = require('socket.io');
const connectDB = require('../configs/db');

// --- IMPORT ROUTES ---
const productRoutes = require('../routes/productRoutes');
const categoryRoutes = require('../routes/categoryRoutes');
const authRoutes = require('../routes/authRoutes');
const cartRoutes = require('../routes/cartRoutes');
const orderRoutes = require('../routes/orderRoutes');
const userRoutes = require('../routes/userRoutes');
const reviewRoutes = require('../routes/reviewRoutes');
const couponRoutes = require('../routes/couponRoutes');
const wishlistRoutes = require('../routes/wishlistRoutes');
const notificationRoutes = require('../routes/notificationRoutes');
const refundRoutes = require('../routes/refundRoutes'); 
const bannerRoutes = require('../routes/bannerRoutes');
const { initializeSocket } = require('../utils/socketHandler');

// --- CONFIG ---
dotenv.config();
connectDB();

const app = express();

const uploadsPath = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log(' Đã tạo thư mục uploads');
}

// --- CORS ---
const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://127.0.0.1:3000', 
    'http://127.0.0.1:5173', 
    'http://127.0.0.1:5174',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// --- SOCKET ---
const server = http.createServer(app);
const io = socketIo(server, { cors: corsOptions });
global.io = io;
initializeSocket(io);

// --- MIDDLEWARES ---
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- STATIC FILES ---
app.use('/uploads', express.static(uploadsPath));

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

// --- TEST ROUTE ---
app.get('/', (req, res) => {
  res.send('Backend Fashion Shop đang chạy cực mượt trên Local!');
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(` Server: http://localhost:${PORT}`);
});