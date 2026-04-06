import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { WishlistProvider } from './context/WishlistContext';
import { ProtectedRoute, AdminRoute } from './utils/ProtectedRoute';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { CartProvider } from './context/CartContext';

// Pages - User
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CartPage } from './pages/CartPage';
import { ProfilePage } from './pages/ProfilePage';
import { OrdersPage } from './pages/OrdersPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { WishlistPage } from './pages/WishlistPage';

// Pages - Auth
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

// Pages - Admin
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminProductManager } from './pages/AdminProductManager';
import { AdminProductAdd } from './pages/AdminProductAdd';
import { AdminProductEditor } from './pages/AdminProductEditor';
import { AdminCategoryManager } from './pages/AdminCategoryManager';
import { AdminUserManager } from './pages/AdminUserManager';
import { AdminReviewManager } from "./pages/AdminReviewManager";
import { AdminCouponManager } from './pages/AdminCouponManager';
import { AdminRefundManager } from './pages/AdminRefundManager';

function App() {
  return (
    <Router>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <SocketProvider>
              <NotificationProvider>
              <Routes>
                {/* ==================== 1. AUTH ROUTES (Không layout) ==================== */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

                {/* ==================== 2. USER ROUTES (Dùng chung Layout) ==================== */}
                <Route element={<Layout><Outlet /></Layout>}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />

                  {/* USER PROTECTED ROUTES (Phải đăng nhập mới vào được) */}
                  <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                  </Route>
                </Route>

                {/* ==================== 3. ADMIN ROUTES (Tối ưu nhất - Chỉ Render Layout 1 lần) ==================== */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Outlet /> {/* Nơi các trang Admin con hiện ra */}
                      </AdminLayout>
                    </AdminRoute>
                  }
                >
                  {/* index có nghĩa là đường dẫn mặc định /admin */}
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProductManager />} />
                  <Route path="products/create" element={<AdminProductAdd />} />
                  <Route path="products/edit/:id" element={<AdminProductEditor />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="categories" element={<AdminCategoryManager />} />
                  <Route path="users" element={<AdminUserManager />} />
                  <Route path="reviews" element={<AdminReviewManager />} />
                  <Route path="coupons" element={<AdminCouponManager />} />
                  <Route path="refunds" element={<AdminRefundManager />} />
                </Route>

                {/* Catch-all: Quay về trang chủ nếu gõ bậy */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* Thông báo Toaster */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#000',
                    color: '#fff',
                    fontSize: '12px',
                    borderRadius: '0px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }
                }}
              />
              </NotificationProvider>
            </SocketProvider>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;