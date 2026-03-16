const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const path = require('path'); 
const socketIo = require('socket.io');
const connectDB = require('./configs/db');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
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
app.use(express.json());

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

app.get('/', (req, res) => {
    res.send('🚀 Backend Fashion Shop đang chạy cực mượt trên Local!');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`📂 Static files: Ready at /uploads`);
});