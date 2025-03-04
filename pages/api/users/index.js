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
        // Lấy danh sách thiết bị đang mượn thay vì chỉ đếm
        borrowedDevices: {
          where: {
            status: 'borrowed' // Chỉ lấy thiết bị đang mượn
          },
          select: {
            id: true
          }
        },
        // Lấy danh sách sự kiện đang diễn ra
        createdEvents: {
          where: {
            status: 'ongoing' // Chỉ lấy sự kiện đang diễn ra
          },
          select: {
            id: true,
            // Đếm số thiết bị trong mỗi sự kiện
            _count: {
              select: {
                eventDevices: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Định dạng lại dữ liệu để đơn giản hơn cho frontend
    const formattedUsers = users.map(user => {
      // Số thiết bị đang mượn trực tiếp
      const directBorrowCount = user.borrowedDevices.length;
      
      // Số thiết bị mượn qua sự kiện đang diễn ra
      const eventDevicesCount = user.createdEvents.reduce((total, event) => {
        return total + event._count.eventDevices;
      }, 0);
      
      return {
        id: user.id,
        name: user.name,
        phone: user.phone,
        borrowedDevicesCount: {
          direct: directBorrowCount,
          events: eventDevicesCount,
          total: directBorrowCount + eventDevicesCount
        }
      };
    });

    return res.status(200).json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ 
      message: 'Không thể tải danh sách người dùng',
      error: error.message 
    });
  }
}

