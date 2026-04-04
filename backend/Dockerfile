# Sử dụng image Node.js bản alpine cho nhẹ gọn
FROM node:18-alpine 

# Đặt thư mục làm việc bên trong container
WORKDIR /usr/src/app 

# Copy file cấu hình trước để tận dụng cache của Docker
COPY package*.json ./ 

# Chạy lệnh cài đặt thư viện
RUN npm install 

# Copy toàn bộ mã nguồn còn lại vào container
COPY . . 

# Mở cổng 5000 cho container
EXPOSE 5000 

# Lệnh khởi chạy ứng dụng khi container bắt đầu
CMD ["npm", "start"]