import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { status } = req.query;
    
    // Build where clause based on status filter
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const devices = await prisma.device.findMany({
      where,
      include: {
        borrower: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(devices);

  } catch (error) {
    console.error('Error fetching devices:', error);
    return res.status(500).json({
      message: 'Không thể tải danh sách thiết bị',
      error: error.message
    });
  }
}