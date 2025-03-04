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
    // Lấy thiết bị với lịch sử đã được tối ưu
    const device = await prisma.device.findUnique({
      where: { id },
      select: {
        // Thông tin cơ bản của thiết bị
        id: true,
        name: true,
        image: true,
        locationImage: true,
        status: true,
        purchaseDate: true,
        warrantyEnd: true,
        warrantyPlace: true,
        notes: true,
        borrowContext: true,
        borrowerId: true,
        eventId: true,
        
        // Thông tin người mượn hiện tại (nếu có)
        borrower: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        
        // Sự kiện hiện tại (nếu có)
        event: {
          select: {
            id: true,
            title: true,
            status: true,
            // Thêm thông tin người tạo sự kiện
            creator: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        },
        
        // Lịch sử mượn trả - chỉ lấy 10 bản ghi gần nhất
        borrowHistory: {
          orderBy: { borrowDate: 'desc' },
          take: 10,
          select: {
            id: true,
            borrowDate: true,
            returnDate: true,
            borrowContext: true,
            
            // Người mượn
            user: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            },
            
            // Người được chuyển (nếu có)
            transferTo: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            },
            
            // Thông tin sự kiện nếu là mượn qua sự kiện
            eventId: true,
            event: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    if (!device) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    }

    // Định dạng lại lịch sử để dễ sử dụng
    const formattedHistory = device.borrowHistory.map(bh => ({
      id: bh.id,
      borrowDate: bh.borrowDate,
      returnDate: bh.returnDate,
      type: bh.borrowContext,
      user: bh.user,
      transferTo: bh.transferTo,
      event: bh.event ? {
        id: bh.event.id,
        title: bh.event.title
      } : null
    }));

    // Thêm thông tin thiết bị và kiểm tra quyền trả
    const response = {
      ...device,
      formattedHistory,
      
      // Kiểm tra quyền trả thiết bị
      canReturn: (user) => {
        // Người dùng phải được xác thực
        if (!user) return false;
        
        // Thiết bị phải đang được mượn
        if (device.status !== 'borrowed') return false;
        
        // Nếu mượn qua sự kiện, chỉ cho phép trả qua quy trình sự kiện
        if (device.borrowContext === 'event') return false;
        
        // Người dùng là người mượn
        if (device.borrowerId === user.id) return true;
        
        // Hoặc là người được chuyển thiết bị gần nhất
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