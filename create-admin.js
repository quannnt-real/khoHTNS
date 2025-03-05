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
    const hashedPassword = await bcrypt.hash('123456789', 10);

    // Tạo người dùng admin
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        phone: '0987654321',
        // email: 'admin@example.com',
        email: 'info@quannnt.com',
        password: hashedPassword,
        role: 'admin'
      }
    });

    // Tạo người dùng user
    const user = await prisma.user.create({
      data: {
        name: 'test',
        phone: '0987654322',
        email: 'game@quannnt.com',
        password: hashedPassword,
        role: 'user'
      }
    });

    console.log('Đã tạo tài khoản admin thành công:');
    console.log('Tên: ' + admin.name);
    console.log('Số điện thoại: ' + admin.phone);
    console.log('Mật khẩu: 123456789');
    console.log('Đã tạo tài khoản user thành công:');
    console.log('Tên: ' + user.name);
    console.log('Số điện thoại: ' + user.phone);
    console.log('Mật khẩu: 123456789');
  } catch (error) {
    console.error('Lỗi khi tạo tài khoản:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();