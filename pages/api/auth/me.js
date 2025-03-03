import { withAuth } from '../../../lib/middleware';
import { prisma } from '../../../lib/prisma';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Lấy thông tin user từ middleware withAuth
    const { id } = req.user;

    // Lấy thông tin chi tiết về người dùng từ database
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        borrowedDevices: {
          select: {
            id: true,
            name: true,
            image: true,
            status: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy thông tin người dùng' });
  }
}

export default withAuth(handler);