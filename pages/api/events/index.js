import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return await getEvents(req, res);
    case 'POST':
      return await createEvent(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Lấy danh sách sự kiện
async function getEvents(req, res) {
  try {
    // Lấy tham số status từ query string
    const { status } = req.query;
    
    // Log để kiểm tra giá trị status
    console.log('Status filter:', status);
    
    // Tạo điều kiện lọc dựa trên status
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: {
        createdDate: 'desc'
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        eventDevices: {
          include: {
            device: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ 
      message: 'Lỗi khi tải danh sách sự kiện',
      error: error.message 
    });
  }
}

// Tạo phiếu mượn sự kiện mới
async function createEvent(req, res) {
  try {
    const { 
      title,        // Thay name thành title
      creatorId, 
      deviceIds 
    } = req.body;

    // Validate dữ liệu đầu vào
    if (!title || !creatorId || !deviceIds || !Array.isArray(deviceIds)) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp đầy đủ thông tin: title, creatorId và deviceIds'
      });
    }

    // Kiểm tra các thiết bị có sẵn không
    const devices = await prisma.device.findMany({
      where: {
        id: { in: deviceIds },
      },
    });

    if (devices.length !== deviceIds.length) {
      return res.status(400).json({ message: 'Một số thiết bị không tồn tại' });
    }

    // Tự động tạo description từ danh sách thiết bị
    const deviceNames = devices.map(device => device.name).join(', ');
    const description = `Sự kiện "${title}" đã mượn các thiết bị: ${deviceNames}`;

    // Kiểm tra xem thiết bị đã được mượn chưa
    const unavailableDevices = [];
    for (const device of devices) {
      if (device.status === 'borrowed') {
        unavailableDevices.push({ id: device.id, name: device.name, reason: 'đang được mượn' });
        continue;
      }
    }

    // Nếu có thiết bị không khả dụng, trả về lỗi
    if (unavailableDevices.length > 0) {
      return res.status(409).json({
        message: 'Một số thiết bị không khả dụng',
        unavailableDevices
      });
    }

    // Tạo sự kiện mới và các liên kết thiết bị trong một giao dịch
    const event = await prisma.$transaction(async (prismaClient) => {
      // Tạo sự kiện mới
      const newEvent = await prismaClient.event.create({
        data: {
          title,
          description,
          status: 'ongoing',  // theo schema mặc định là 'ongoing'
          creatorId,
        },
      });

      // Tạo các liên kết thiết bị
      for (const deviceId of deviceIds) {
        await prismaClient.eventDevice.create({
          data: {
            eventId: newEvent.id,
            deviceId,
            condition: 'normal' // Theo schema, condition chỉ có normal hoặc damaged
          },
        });
        
        // Cập nhật trạng thái của thiết bị
        await prismaClient.device.update({
          where: { id: deviceId },
          data: { 
            status: 'borrowed',
            eventId: newEvent.id,
            borrowContext: 'event'
          }
        });
        
        // Thêm vào bảng lịch sử mượn
        await prismaClient.borrowHistory.create({
          data: {
            deviceId,
            userId: creatorId,
            borrowContext: 'event',
            eventId: newEvent.id
          }
        });
      }

      // Trả về sự kiện đã tạo kèm thông tin chi tiết
      return prismaClient.event.findUnique({
        where: { id: newEvent.id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          },
          eventDevices: {
            include: {
              device: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          }
        },
      });
    });

    return res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ 
      message: 'Lỗi khi tạo phiếu mượn sự kiện', 
      error: error.message 
    });
  }
}