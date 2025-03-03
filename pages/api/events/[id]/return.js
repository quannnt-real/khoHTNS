import { prisma } from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  const { deviceConditions } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái event
      const event = await tx.event.update({
        where: { id },
        data: {
          status: 'completed',
          returnedDate: new Date()
        },
        include: {
          eventDevices: {
            include: {
              device: true
            }
          }
        }
      });

      // 2. Cập nhật từng thiết bị và eventDevice
      for (const dc of deviceConditions) {
        const eventDevice = event.eventDevices.find(
          ed => ed.device.id === dc.deviceId
        );

        if (eventDevice) {
          // Cập nhật điều kiện trong eventDevice
          await tx.eventDevice.update({
            where: { id: eventDevice.id },
            data: { condition: dc.condition }
          });

          // Reset trạng thái thiết bị
          await tx.device.update({
            where: { id: dc.deviceId },
            data: {
              status: 'available',
              borrowerId: null,
              borrowContext: null,
              eventId: null
            }
          });

          // Tạo bản ghi trả thiết bị trong borrowHistory
          await tx.borrowHistory.updateMany({
            where: {
              deviceId: dc.deviceId,
              eventId: id,
              returnDate: null
            },
            data: {
              returnDate: new Date()
            }
          });
        }
      }

      return event;
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error in return handler:', error);
    return res.status(500).json({
      message: 'Lỗi khi cập nhật: ' + error.message
    });
  }
}
