import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // Get device with complete history
    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        borrower: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        event: true,
        borrowHistory: {
          orderBy: { borrowDate: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            },
            event: true
          }
        },
        eventDevices: {
          include: {
            event: true
          }
        }
      }
    });

    if (!device) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    }

    // Format response to include both personal and event history
    const formattedHistory = device.borrowHistory.map(bh => ({
      ...bh,
      type: bh.borrowContext,
      eventInfo: bh.event || null
    }));

    // Add device and history info to response
    const response = {
      ...device,
      formattedHistory,
      // Don't allow return if device was borrowed through event
      canReturn: device.status === 'borrowed' && device.borrowContext === 'personal'
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error handling device request:', error);
    return res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
}