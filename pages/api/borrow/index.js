import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  switch (req.method) {
    case 'POST':
      return borrowDevice(req, res);
    case 'PUT':
      return returnDevice(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Borrow a device
async function borrowDevice(req, res) {
  try {
    const { deviceIds, userId } = req.body;

    if (!userId || !deviceIds?.length) {
      return res.status(400).json({ 
        message: 'Thiếu thông tin người dùng hoặc thiết bị' 
      });
    }

    // Kiểm tra thiết bị
    const devices = await prisma.device.findMany({
      where: { id: { in: deviceIds } }
    });

    if (!devices.length) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    }

    // Kiểm tra trạng thái mượn
    const borrowedDevices = devices.filter(d => d.status === 'borrowed');
    if (borrowedDevices.length > 0) {
      return res.status(400).json({
        message: `${borrowedDevices.length} thiết bị đã được mượn`
      });
    }

    // Thực hiện mượn thiết bị
    await prisma.$transaction(deviceIds.map(deviceId => ([
      prisma.borrowHistory.create({
        data: {
          deviceId,
          userId,
          borrowDate: new Date()
        }
      }),
      prisma.device.update({
        where: { id: deviceId },
        data: {
          status: 'borrowed',
          borrowerId: userId
        }
      })
    ])).flat());

    return res.status(200).json({
      success: true,
      message: 'Mượn thiết bị thành công'
    });

  } catch (error) {
    console.error('Borrow error:', error);
    return res.status(500).json({
      message: 'Lỗi khi mượn thiết bị',
      error: error.message
    });
  }
}

// Return a device
async function returnDevice(req, res) {
  try {
    const { deviceId, locationImage, userId } = req.body;
    
    // Validate required fields
    if (!deviceId || !userId) {
      return res.status(400).json({ message: 'ID thiết bị và ID người dùng là bắt buộc' });
    }
    
    // Check if the device exists and is borrowed
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        borrower: true
      }
    });
    
    if (!device) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    }
    
    if (device.status !== 'borrowed') {
      return res.status(400).json({ message: 'Thiết bị hiện không ở trạng thái đang mượn' });
    }
    
    // Kiểm tra người dùng hiện tại có phải là người đang mượn thiết bị không
    if (device.borrowerId !== userId) {
      return res.status(403).json({ 
        message: 'Bạn không có quyền trả thiết bị này vì bạn không phải là người mượn'
      });
    }
    
    // Update the device status, location image, and borrow history
    const updatedDevice = await prisma.$transaction([
      prisma.device.update({
        where: { id: deviceId },
        data: {
          status: 'available',
          borrowerId: null,
          borrowContext: null,
          eventId: null,
          locationImage: locationImage || device.locationImage
        }
      }),
      prisma.borrowHistory.updateMany({
        where: { 
          deviceId,
          userId,
          returnDate: null
        },
        data: {
          returnDate: new Date()
        }
      })
    ]);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Trả thiết bị thành công',
      device: updatedDevice[0] 
    });
  } catch (error) {
    console.error('Error returning device:', error);
    return res.status(500).json({ message: 'Lỗi khi trả thiết bị' });
  }
}