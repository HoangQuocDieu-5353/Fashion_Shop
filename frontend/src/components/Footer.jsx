import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';

/**
 * Footer - Chân trang
 * Hiển thị thông tin công ty, liên kết, và mạng xã hội
 */
export const Footer = () => {
  return (
    <footer className="bg-secondary text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">👗 Fashion Shop</h3>
            <p className="text-gray-400 text-sm">
              Cửa hàng bán quần áo trực tuyến hàng đầu với đa dạng sản phẩm chất lượng cao.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Liên Kết Nhanh</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary transition">
                  Trang Chủ
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-400 hover:text-primary transition">
                  Sản Phẩm
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-gray-400 hover:text-primary transition">
                  Danh Mục
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="text-lg font-bold mb-4">Hỗ Trợ Khách Hàng</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition">
                  Liên Hệ
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition">
                  Câu Hỏi Thường Gặp
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition">
                  Chính Sách Hoàn Lại
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-bold mb-4">Kết Nối Với Chúng Tôi</h3>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-primary transition">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition">
                <Mail className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <p className="text-center text-gray-400 text-sm">
            &copy; 2026 Fashion Shop. Bảo lưu mọi quyền. Phát triển bởi Dev Team.
          </p>
        </div>
      </div>
    </footer>
  );
};
