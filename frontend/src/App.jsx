import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { WishlistProvider } from './context/WishlistContext'; // 🚀 1. Import WishlistProvider
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
import { WishlistPage } from './pages/WishlistPage'; // 🚀 2. Import trang Wishlist (Lát mình tạo)

// Pages - Auth
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Pages - Admin
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminProductManager } from './pages/AdminProductManager';
import { AdminProductEditor } from './pages/AdminProductEditor';
import { AdminCategoryManager } from './pages/AdminCategoryManager';
import { AdminUserManager } from './pages/AdminUserManager';

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* 🚀 3. BỌC WISHLISTPROVIDER Ở ĐÂY - Nguồn cấp dữ liệu cho toàn app */}
        <WishlistProvider>
          <CartProvider>
            <SocketProvider>
              <Routes>
                {/* ==================== 1. PUBLIC ROUTES ==================== */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                {/* ==================== 2. USER ROUTES ==================== */}
                <Route element={<Layout children={<HomePage />} />} path="/" />
                
                <Route 
                  path="/products" 
                  element={<Layout><ProductsPage /></Layout>} 
                />
                
                <Route
                  path="/products/:id"
                  element={<Layout><ProductDetailPage /></Layout>}
                />

                {/* 🚀 ROUTE TRANG YÊU THÍCH */}
                <Route
                  path="/wishlist"
                  element={<Layout><WishlistPage /></Layout>}
                />

                {/* ==================== 3. PROTECTED ROUTES ==================== */}
                <Route
                  path="/cart"
                  element={<Layout><ProtectedRoute><CartPage /></ProtectedRoute></Layout>}
                />
                <Route
                  path="/profile"
                  element={<Layout><ProtectedRoute><ProfilePage /></ProtectedRoute></Layout>}
                />
                <Route
                  path="/checkout"
                  element={<Layout><ProtectedRoute><CheckoutPage /></ProtectedRoute></Layout>}
                />
                <Route
                  path="/orders"
                  element={<Layout><ProtectedRoute><OrdersPage /></ProtectedRoute></Layout>}
                />

                {/* ==================== 4. ADMIN ROUTES ==================== */}
                <Route
                  path="/admin"
                  element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>}
                />
                <Route
                  path="/admin/products"
                  element={<AdminRoute><AdminLayout><AdminProductManager /></AdminLayout></AdminRoute>}
                />
                <Route
                  path="/admin/products/edit/:id"
                  element={<AdminRoute><AdminLayout><AdminProductEditor /></AdminLayout></AdminRoute>}
                />
                <Route
                  path="/admin/orders"
                  element={<AdminRoute><AdminLayout><AdminOrdersPage /></AdminLayout></AdminRoute>}
                />
                <Route
                  path="/admin/categories"
                  element={<AdminRoute><AdminLayout><AdminCategoryManager /></AdminLayout></AdminRoute>}
                />
                <Route
                  path="/admin/users"
                  element={<AdminRoute><AdminLayout><AdminUserManager /></AdminLayout></AdminRoute>}
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

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
            </SocketProvider>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;