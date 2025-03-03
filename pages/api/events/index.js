import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Đơn giản hóa query để tìm lỗi
    console.log('Fetching events...');
    
    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        createdDate: true,
        creator: {
          select: {
            name: true,
            phone: true
          }
        },
        eventDevices: {
          select: {
            id: true,
            device: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdDate: 'desc'
      }
    });

    console.log('Events found:', events.length);
    return res.status(200).json(events);

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      message: 'Lỗi khi tải danh sách phiếu mượn',
      error: error.message 
    });
  }
}