// Tạo file hướng dẫn thiết lập cho repo mới

console.log(`
============================================================
=           HƯỚNG DẪN THIẾT LẬP DỰ ÁN QLKho              =
============================================================

Các bước thiết lập sau khi clone dự án từ git về:

1. Cài đặt các phụ thuộc:
   npm install

2. Tạo cơ sở dữ liệu và thiết lập schema Prisma:
   npx prisma migrate dev --name init

3. Tạo thư mục uploads:
   mkdir -p public/uploads

4. Tạo tài khoản admin (chạy script tạo sẵn):
   node create-admin.js

5. Khởi động ứng dụng:
   npm run dev


CẤU TRÚC DỰ ÁN:
===============

- pages/: Chứa các trang và API Routes
  - api/: Endpoints API REST
  - [Các trang giao diện người dùng]

- components/: Các thành phần UI tái sử dụng
  - DeviceCard.js: Hiển thị thông tin thiết bị
  - ImageUpload.js: Component tải lên ảnh
  - Layout.js: Bố cục chung cho trang

- lib/: Các tiện ích, tiện ích và cấu hình
  - auth.js: Xác thực người dùng
  - middleware.js: Middleware API
  - prisma.js: Kết nối cơ sở dữ liệu

- public/: Tài nguyên tĩnh
  - uploads/: Chứa ảnh tải lên (cần tạo thư mục này)

- styles/: Stylesheets toàn cục
  - globals.css: Định nghĩa style toàn cầu
  
- prisma/: 
  - schema.prisma: Định nghĩa mô hình dữ liệu

CÁC TÍNH NĂNG:
=============

- Quản lý thiết bị (thêm, xem, cập nhật)
- Mượn/trả thiết bị
- Chuyển thiết bị giữa người dùng
- Quản lý sự kiện
- Xác thực người dùng (đăng nhập, đăng ký)
- Phân quyền (admin/user)
- Quản lý hình ảnh thiết bị và vị trí lưu trữ

LƯU Ý:
======

- File cơ sở dữ liệu (dev.db) sẽ được tạo khi chạy lệnh migrate
- Nếu bạn gặp vấn đề với hình ảnh, đảm bảo đã tạo thư mục /public/uploads
- Đảm bảo bạn chạy script tạo admin trước khi sử dụng hệ thống

Báo cáo lỗi và góp ý tại [địa chỉ liên hệ]
`);

// Gợi ý tạo file create-admin.js cho người dùng
console.log(`
Ví dụ về nội dung file create-admin.js bạn cần tạo:

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Kiểm tra nếu đã tồn tại admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('Tài khoản admin đã tồn tại:');
      console.log('Tên: ' + existingAdmin.name);
      console.log('Số điện thoại: ' + existingAdmin.phone);
      return;
    }

    // Tạo mật khẩu mã hóa
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Tạo người dùng admin
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        phone: '0987654321',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      }
    });

    console.log('Đã tạo tài khoản admin thành công:');
    console.log('Tên: ' + admin.name);
    console.log('Số điện thoại: ' + admin.phone);
    console.log('Mật khẩu: admin123');
  } catch (error) {
    console.error('Lỗi khi tạo tài khoản admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
`);