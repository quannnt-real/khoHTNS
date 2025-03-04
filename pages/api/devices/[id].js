import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return getDevice(req, res, id);
    case 'PUT':
      return updateDevice(req, res, id);
    case 'DELETE':
      return deleteDevice(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getDevice(req, res, id) {
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
            transferTo: {
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
      // canReturn: device.status === 'borrowed' && device.borrowContext === 'personal'

      // Check if device can be returned by current user
      canReturn: (user) => {
        // User must be authenticated
        if (!user) return false;
        
        // Device must be borrowed
        if (device.status !== 'borrowed') return false;
        
        // If borrowed through event, only allow return through event process
        if (device.borrowContext === 'event') return false;
        
        // User must be either the borrower
        if (device.borrowerId === user.id) return true;
        
        // Or the last person the device was transferred to
        if (device.borrowHistory.length > 0 && device.borrowContext === 'personal') {
          const lastHistory = device.borrowHistory[0];
          if (lastHistory.transferTo && lastHistory.transferTo.id === user.id) {
            return true;
          }
        }
        
        return false;
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching device:', error);
    return res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
}

async function updateDevice(req, res, id) {
  try {
    // Check if device exists
    const existingDevice = await prisma.device.findUnique({
      where: { id },
      select: { id: true, borrowerId: true }
    });

    if (!existingDevice) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    }

    // Extract data from request body
    const { 
      name, 
      status, 
      image, 
      locationImage, 
      purchaseDate, 
      warrantyEnd, 
      warrantyPlace, 
      notes 
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Thiếu thông tin: Tên thiết bị là bắt buộc' });
    }

    // Update device
    const updatedDevice = await prisma.device.update({
      where: { id },
      data: {
        name,
        status: existingDevice.borrowerId ? 'borrowed' : status, // Only allow status change if not borrowed
        image,
        locationImage,
        purchaseDate,
        warrantyEnd,
        warrantyPlace,
        notes
      }
    });

    return res.status(200).json({
      message: 'Cập nhật thiết bị thành công',
      device: updatedDevice
    });

  } catch (error) {
    console.error('Error updating device:', error);
    return res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
}

async function deleteDevice(req, res, id) {
  try {
    // Check if device exists and if it's currently borrowed
    const device = await prisma.device.findUnique({
      where: { id },
      select: { 
        id: true, 
        name: true, 
        borrowerId: true,
        borrowHistory: {
          select: { id: true }
        }
      }
    });

    if (!device) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    }

    // Check if device is currently borrowed
    if (device.borrowerId) {
      return res.status(400).json({ 
        message: 'Không thể xóa thiết bị đang được mượn. Vui lòng yêu cầu trả thiết bị trước khi xóa.' 
      });
    }

    // Use transaction to delete borrowHistory first (to avoid foreign key constraints)
    await prisma.$transaction([
      // Delete related borrow history records
      prisma.borrowHistory.deleteMany({
        where: { deviceId: id }
      }),
      // Delete related event device records
      prisma.eventDevice.deleteMany({
        where: { deviceId: id }
      }),
      // Delete the device
      prisma.device.delete({
        where: { id }
      })
    ]);

    return res.status(200).json({
      message: 'Xóa thiết bị thành công',
      deletedDevice: device.name
    });

  } catch (error) {
    console.error('Error deleting device:', error);
    return res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
}