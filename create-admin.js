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