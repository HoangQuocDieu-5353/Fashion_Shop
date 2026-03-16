# 👗 Fashion Shop - Frontend (React + Vite)

## 📚 Giới Thiệu

Frontend của Fashion Shop được xây dựng với React (Vite) với các tính năng:

- ✅ Xác thực người dùng (Login/Register)
- ✅ Quản lý trạng thái Auth với Context API
- ✅ Kết nối Socket.io real-time notifications
- ✅ Bảo vệ routes (ProtectedRoute, AdminRoute)
- ✅ Giao diện responsive với Tailwind CSS
- ✅ Toast notifications với react-hot-toast

---

## 🚀 Cài Đặt & Chạy

### 1. Cài Đặt Dependencies

```bash
cd frontend
npm install
```

### 2. Tạo File .env.local

```bash
cp .env.example .env.local
```

### 3. Chạy Development Server

```bash
npm run dev
```

App sẽ mở tại `http://localhost:5173`

### 4. Build Production

```bash
npm run build
npm run preview
```

---

## 📁 Cấu Trúc Thư Mục

```
frontend/
├── public/                 # Static files
├── src/
│   ├── api/
│   │   └── axiosInstance.js    # Cấu hình Axios với interceptors
│   ├── context/
│   │   ├── AuthContext.jsx     # Context quản lý xác thực
│   │   └── SocketContext.jsx   # Context quản lý Socket.io
│   ├── components/
│   │   ├── Header.jsx          # Thanh điều hướng
│   │   ├── Footer.jsx          # Chân trang
│   │   └── Layout.jsx          # Layout chính
│   ├── hooks/
│   │   ├── useAuth.js          # Hook sử dụng AuthContext
│   │   └── useSocket.js        # Hook sử dụng SocketContext
│   ├── pages/
│   │   ├── HomePage.jsx        # Trang chủ
│   │   ├── LoginPage.jsx       # Trang đăng nhập
│   │   ├── RegisterPage.jsx    # Trang đăng ký
│   │   ├── CartPage.jsx        # Trang giỏ hàng
│   │   ├── ProfilePage.jsx     # Trang hồ sơ
│   │   ├── OrdersPage.jsx      # Trang đơn hàng
│   │   ├── AdminDashboardPage.jsx   # Trang chính Admin
│   │   └── AdminOrdersPage.jsx      # Trang quản lý đơn hàng
│   ├── utils/
│   │   └── ProtectedRoute.jsx  # Route protection
│   ├── App.jsx                 # Component chính
│   ├── main.jsx                # Entry point
│   └── index.css              # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.local
```

---

## 🔐 Xác Thực (Auth Flow)

### 1. Đăng Nhập

```javascript
import { useAuth } from './hooks/useAuth';

function LoginComponent() {
  const { login, loading } = useAuth();

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
      // Redirect to home
    } catch (error) {
      console.error('Lỗi:', error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleLogin(email, password);
    }}>
      {/* Form fields */}
    </form>
  );
}
```

### 2. Lấy Token & Gửi Requests

Token tự động được thêm vào mọi request via Axios interceptor:

```javascript
// axiosInstance.js
const token = localStorage.getItem('token');
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

### 3. Xử Lý Lỗi 401

Khi token hết hạn, response interceptor tự động:
- ❌ Xóa token khỏi localStorage
- ⚠️ Hiển thị toast error
- 🔄 Redirect về /login

---

## 🔌 Socket.io Real-time Notifications

### 1. Kết Nối Socket

```javascript
import { useSocket } from './hooks/useSocket';

function Component() {
  const { socket, isConnected } = useSocket();

  return <div>{isConnected ? '✅ Connected' : '❌ Disconnected'}</div>;
}
```

### 2. Lắng Nghe Events

```javascript
// Admin: Lắng nghe thông báo đơn hàng mới
socket.on('newOrderAdmin', (notification) => {
  // Hiển thị toast notification
  toast.custom((t) => (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h3>{notification.title}</h3>
      <p>{notification.message}</p>
    </div>
  ));
});

// Customer: Lắng nghe cập nhật trạng thái
socket.on('orderStatusUpdate', (notification) => {
  // Cập nhật UI...
});
```

---

## 🛣️ Routing & Protected Routes

### 1. ProtectedRoute - Chỉ Admin & Customer

```javascript
<Route
  path="/cart"
  element={
    <ProtectedRoute>
      <CartPage />
    </ProtectedRoute>
  }
/>
```

### 2. AdminRoute - Chỉ Admin

```javascript
<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminDashboardPage />
    </AdminRoute>
  }
/>
```

Nếu user không đủ quyền → Redirect về home

---

## 🎨 Giao Diện & Styling

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: '#ef4444',      // Màu đỏ chính
      secondary: '#1f2937',    // Màu xám
      success: '#10b981',      // Màu xanh lá
      warning: '#f59e0b',      // Màu cam
      error: '#ef4444',        // Màu đỏ
    },
  },
}
```

### Responsive Design

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Trên mobile: 1 cột, md: 2 cột, lg: 4 cột */}
</div>
```

---

## 📦 Dependencies

- **react** - UI library
- **react-dom** - React DOM package
- **react-router-dom** - Routing library
- **axios** - HTTP client
- **socket.io-client** - WebSocket client
- **react-hot-toast** - Toast notifications
- **tailwindcss** - Utility-first CSS framework
- **lucide-react** - Icon library

---

## 🧪 Demo Credentials

```
Email: admin@example.com
Password: password123
```

---

## 📝 Environment Variables

```
# .env.local
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=Fashion Shop
VITE_APP_VERSION=0.1.0
```

---

## 🔗 API Endpoints Used

### Auth
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký

### Users
- `GET /api/users/me` - Lấy thông tin user
- `PATCH /api/users/profile` - Cập nhật hồ sơ
- `POST /api/users/change-password` - Đổi mật khẩu

### Orders
- `GET /api/orders/my-orders` - Lấy đơn hàng của tôi
- `GET /api/orders/admin/all-orders` - Lấy tất cả đơn (Admin)
- `GET /api/orders/admin/dashboard-stats` - Thống kê (Admin)
- `PATCH /api/orders/admin/update-status/:id` - Cập nhật trạng thái

---

## 🐛 Troubleshooting

### 1. CORS Error

**Vấn đề**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Giải pháp**: Kiểm tra CORS config trong backend `src/server.js`

```javascript
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
};
```

### 2. Socket Connection Failed

**Vấn đề**: Socket không kết nối được

**Giải pháp**:
- Kiểm tra token trong localStorage
- Kiểm tra Socket.io config trong backend
- Mở DevTools Console để xem error

### 3. Token Expired

**Vấn đề**: Nhận lỗi 401 "Token hết hạn"

**Giải pháp**: Tự động được xử lý bởi response interceptor
- Token được xóa
- Redirect về /login
- Toast error hiển thị

---

## 📚 Tài Liệu Thêm

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)
- [Axios Documentation](https://axios-http.com)

---

## 🤝 Đóng Góp

Nếu bạn muốn đóng góp, vui lòng:
1. Fork repository
2. Tạo branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

---

## 📄 Giấy Phép

Dự án này được cấp phép dưới MIT License.

---

**✨ Happy Coding! 🚀**
