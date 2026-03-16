# Quy tắc lập trình cho dự án Fashion Shop (HUTECH)

## 1. Nguyên tắc chung
- **Hệ thống Module**: Luôn dùng **CommonJS** (`require` và `module.exports`). Tuyệt đối không dùng ES Modules (`import/export`) [cite: 2026-03-04].
- **Ngôn ngữ**: Tên biến/hàm bằng tiếng Anh. Chú thích và thông báo API bằng **tiếng Việt** [cite: 2026-03-04].
- **Xử lý bất đồng bộ**: Luôn dùng `async/await` và bọc trong khối `try/catch` [cite: 2026-03-04].

## 2. Quy tắc đặt tên
- **Biến/Hàm**: `camelCase` (ví dụ: `createProduct`).
- **Models**: `PascalCase` (ví dụ: `Product.js`).
- **Thư mục/File**: `camelCase` (ví dụ: `productController.js`, `productRoutes.js`).

## 3. Cấu trúc Schema & Logic Sản phẩm
- **Xóa mềm (Soft Delete)**: 
    - Không dùng `findByIdAndDelete` [cite: 2026-03-04].
    - Dùng cờ `isDeleted: { type: Boolean, default: false }` và `deletedAt: { type: Date }` [cite: 2026-03-04].
- **Hình ảnh**: 
    - Dùng `multer` để xử lý upload [cite: 2026-03-04].
    - `images`: Mảng các chuỗi chứa đường dẫn file [cite: 2026-03-04].
    - `mainImage`: Chuỗi chứa ảnh đại diện chính.
- **Dữ liệu**: Có đầy đủ `name`, `price`, `description`, `category`, `sizes` (mảng), `colors` (mảng), `stock` [cite: 2026-03-04].

## 4. Định dạng phản hồi API
Mọi phản hồi phải trả về theo cấu trúc:
{
  "success": true/false,
  "message": "Thông báo tiếng Việt",
  "data": {} // hoặc []
}