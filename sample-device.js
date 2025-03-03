// Script để tạo dữ liệu mẫu cho thiết bị
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Kiểm tra xem đã có thiết bị trong cơ sở dữ liệu chưa
    const existingDevicesCount = await prisma.device.count();
    
    if (existingDevicesCount > 0) {
      console.log(`Đã có ${existingDevicesCount} thiết bị trong cơ sở dữ liệu.`);
      console.log('Nếu bạn muốn tạo lại dữ liệu mẫu, hãy xóa tất cả thiết bị hiện có trước.');
      return;
    }

    // Dữ liệu mẫu cho thiết bị
    const sampleDevices = [
      {
        name: 'Máy quay Canon EOS R5',
        image: '/uploads/sample-camera.jpg', // Cần có file này trong thư mục public/uploads
        purchaseDate: '2023-01-15',
        warrantyEnd: '2025-01-15',
        warrantyPlace: 'Canon Việt Nam',
        notes: 'Máy quay 8K, phù hợp cho các sự kiện lớn'
      },
      {
        name: 'Micro không dây Rode Wireless GO II',
        image: '/uploads/sample-mic.jpg', // Cần có file này trong thư mục public/uploads
        purchaseDate: '2023-03-10',
        warrantyEnd: '2025-03-10',
        warrantyPlace: 'Rode Việt Nam',
        notes: 'Bộ 2 micro không dây, pin sử dụng đến 7 giờ'
      },
      {
        name: 'Đèn LED Godox SL-60W',
        image: '/uploads/sample-light.jpg', // Cần có file này trong thư mục public/uploads
        purchaseDate: '2023-02-20',
        warrantyEnd: '2024-02-20',
        warrantyPlace: 'Godox Store',
        notes: 'Đèn LED 60W, có thể điều chỉnh nhiệt độ màu'
      },
      {
        name: 'Tripod Manfrotto 055XPRO3',
        image: '/uploads/sample-tripod.jpg', // Cần có file này trong thư mục public/uploads
        purchaseDate: '2023-04-05',
        warrantyEnd: '2026-04-05',
        warrantyPlace: 'Manfrotto Việt Nam',
        notes: 'Chân máy chuyên nghiệp, tải trọng tối đa 9kg'
      },
      {
        name: 'Gimbal DJI RS 2',
        image: '/uploads/sample-gimbal.jpg', // Cần có file này trong thư mục public/uploads
        purchaseDate: '2023-05-12',
        warrantyEnd: '2025-05-12',
        warrantyPlace: 'DJI Store',
        notes: 'Gimbal 3 trục, tải trọng 4.5kg'
      }
    ];

    // Tạo thiết bị trong cơ sở dữ liệu
    for (const deviceData of sampleDevices) {
      await prisma.device.create({
        data: deviceData
      });
    }

    console.log(`Đã tạo ${sampleDevices.length} thiết bị mẫu thành công.`);
    console.log('Lưu ý: Bạn cần tự thêm các file hình ảnh vào thư mục public/uploads để hiển thị hình ảnh thiết bị.');
    
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu mẫu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();