import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        borrowedDevices: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            borrowedDevices: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ 
      message: 'Không thể tải danh sách người dùng',
      error: error.message 
    });
  }
}

