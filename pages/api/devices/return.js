import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { deviceId } = req.body;

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        borrowHistory: {
          where: { returnDate: null },
          take: 1
        }
      }
    });

    if (!device) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    }

    if (device.borrowContext === 'event') {
      return res.status(400).json({ 
        message: 'Thiết bị này được mượn qua sự kiện. Vui lòng trả qua trang sự kiện.' 
      });
    }

    // Cập nhật trong transaction
    await prisma.$transaction([
      // Cập nhật trạng thái thiết bị
      prisma.device.update({
        where: { id: deviceId },
        data: {
          status: 'available',
          borrowerId: null,
          borrowContext: null
        }
      }),
      // Cập nhật lịch sử mượn
      prisma.borrowHistory.updateMany({
        where: {
          deviceId,
          returnDate: null
        },
        data: {
          returnDate: new Date()
        }
      })
    ]);

    return res.status(200).json({ message: 'Trả thiết bị thành công' });

  } catch (error) {
    console.error('Error returning device:', error);
    return res.status(500).json({ message: 'Lỗi khi trả thiết bị' });
  }
}
