import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
  }

  switch (req.method) {
    case 'DELETE':
      return deleteUser(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function deleteUser(req, res, userId) {
  try {
    // Kiểm tra user tồn tại và lấy thông tin về thiết bị đang mượn
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        borrowedDevices: true,
      }
    });

    if (!user) {
      return res.status(404).json({ 
        message: 'Không tìm thấy người dùng' 
      });
    }

    // Kiểm tra thiết bị đang mượn
    if (user.borrowedDevices.length > 0) {
      return res.status(400).json({ 
        message: `Không thể xóa người dùng đang mượn ${user.borrowedDevices.length} thiết bị`,
        devices: user.borrowedDevices.length
      });
    }

    // Xóa theo thứ tự để tránh lỗi khóa ngoại
    await prisma.$transaction([
      // Xóa lịch sử mượn trả
      prisma.borrowHistory.deleteMany({
        where: { 
          OR: [
            { userId: userId },
            { transferToId: userId },
            { transferFromId: userId }
          ]
        }
      }),
      // Xóa các sự kiện liên quan
      prisma.event.deleteMany({
        where: {
          OR: [
            { creatorId: userId },
            { updaterId: userId }
          ]
        }
      }),
      // Cuối cùng xóa user
      prisma.user.delete({
        where: { id: userId }
      })
    ]);

    return res.status(200).json({ 
      message: 'Xóa người dùng thành công',
      deletedUser: user.name
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ 
      message: 'Lỗi khi xóa người dùng',
      error: error.message
    });
  }
}
