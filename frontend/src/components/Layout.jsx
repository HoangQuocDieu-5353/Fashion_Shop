import { Outlet } from 'react-router-dom'; // 🚀 BẮT BUỘC: Để hiển thị nội dung trang con
import { Header } from './Header';
import { Footer } from './Footer';

/**
 * Layout - Layout chính bao gồm Header, Outlet (nội dung thay đổi), và Footer
 */
export const Layout = () => { // 🚀 Bỏ prop { children }
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header - Giữ nguyên vị trí */}
      <Header />

      {/* Main Content - Nơi chứa các trang con như HomePage, ProductsPage, v.v. */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* 🚀 THAY THẾ {children} BẰNG <Outlet /> */}
        <Outlet /> 
      </main>

      {/* Footer - Giữ nguyên vị trí */}
      <Footer />
    </div>
  );
};