import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  
  switch (req.method) {
    case 'GET':
      return getEvent(req, res, id);
    case 'PUT':
      return updateEvent(req, res, id);
    case 'DELETE':
      return deleteEvent(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getEvent(req, res, id) {
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        // Thông tin cơ bản của sự kiện
        id: true,
        title: true,
        status: true,
        createdDate: true,
        returnedDate: true,
        
        // Thông tin người tạo sự kiện
        creator: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        
        // Thông tin người cập nhật (nếu đã hoàn thành)
        updater: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        
        // Danh sách thiết bị trong sự kiện
        eventDevices: {
          select: {
            id: true,
            condition: true,
            device: {
              select: {
                id: true,
                name: true,
                image: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    }

    return res.json(event);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Lỗi khi tải thông tin sự kiện',
      error: error.message 
    });
  }
}

// Cập nhật function updateEvent để hỗ trợ cập nhật thiết bị
async function updateEvent(req, res, id) {
  try {
    // Kiểm tra nếu có trường deviceConditions thì đây là yêu cầu trả thiết bị
    if (req.body.deviceConditions) {
      return returnDevices(req, res, id);
    }
    
    // Nếu không, đây là yêu cầu cập nhật thông tin sự kiện
    const { title, updaterId, deviceIds } = req.body;
    
    // Validate required fields
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Tiêu đề sự kiện là bắt buộc' });
    }
    
    if (!updaterId) {
      return res.status(400).json({ message: 'Người cập nhật là bắt buộc' });
    }
    
    if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({ message: 'Cần chọn ít nhất một thiết bị' });
    }
    
    // Kiểm tra người cập nhật có tồn tại không
    const updater = await prisma.user.findUnique({
      where: { id: updaterId },
      select: { id: true }
    });
    
    if (!updater) {
      return res.status(404).json({ message: 'Không tìm thấy người cập nhật' });
    }
    
    // Kiểm tra sự kiện tồn tại không
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        eventDevices: {
          select: {
            id: true,
            deviceId: true
          }
        }
      }
    });
    
    if (!existingEvent) {
      return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    }
    
    if (existingEvent.status !== 'ongoing') {
      return res.status(400).json({ message: 'Không thể sửa sự kiện đã hoàn thành' });
    }
    
    // Cập nhật sự kiện trong transaction để đảm bảo tính nhất quán
    await prisma.$transaction(async (prismaClient) => {
      // Cập nhật thông tin cơ bản sự kiện
      await prismaClient.event.update({
        where: { id },
        data: { 
          title,
          updaterId
        }
      });
      
      // Lấy danh sách thiết bị hiện tại trong sự kiện
      const currentDeviceIds = existingEvent.eventDevices.map(ed => ed.deviceId);
      
      // Thiết bị cần thêm mới
      const devicesToAdd = deviceIds.filter(deviceId => !currentDeviceIds.includes(deviceId));
      
      // Thiết bị cần xóa
      const devicesToRemove = currentDeviceIds.filter(deviceId => !deviceIds.includes(deviceId));
      
      // Xóa thiết bị khỏi sự kiện
      if (devicesToRemove.length > 0) {
        await prismaClient.eventDevice.deleteMany({
          where: {
            AND: [
              { eventId: id },
              { deviceId: { in: devicesToRemove } }
            ]
          }
        });
        
        // Cập nhật trạng thái thiết bị về available
        await prismaClient.device.updateMany({
          where: { id: { in: devicesToRemove } },
          data: {
            status: 'available',
            eventId: null,
            borrowerId: null,
            borrowContext: null
          }
        });
      }
      
      // Thêm thiết bị mới vào sự kiện
      if (devicesToAdd.length > 0) {
        // Tạo các bản ghi EventDevice mới
        for (const deviceId of devicesToAdd) {
          await prismaClient.eventDevice.create({
            data: {
              eventId: id,
              deviceId,
              condition: 'good'
            }
          });
          
          // Cập nhật trạng thái thiết bị thành borrowed
          await prismaClient.device.update({
            where: { id: deviceId },
            data: {
              status: 'borrowed',
              eventId: id,
              borrowerId: existingEvent.creatorId,
              borrowContext: `Mượn cho sự kiện: ${title}`
            }
          });
        }
      }
    });
    
    // Fetch the updated event with all related data
    const updatedEvent = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        createdDate: true,
        returnedDate: true,
        creator: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        updater: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        eventDevices: {
          select: {
            id: true,
            condition: true,
            device: {
              select: {
                id: true,
                name: true,
                image: true,
                status: true
              }
            }
          }
        }
      }
    });
    
    return res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ message: 'Error updating event: ' + error.message });
  }
}


// Hàm riêng cho việc trả thiết bị
async function returnDevices(req, res, id) {
  try {
    const { updaterId, deviceConditions } = req.body;
    
    // Validate required fields
    if (!updaterId || !deviceConditions) {
      return res.status(400).json({ message: 'Updater ID and device conditions are required' });
    }
    
    // Check if the event exists and is ongoing
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: {
        status: true,
        eventDevices: {
          select: {
            id: true,
            deviceId: true
          }
        }
      }
    });
    
    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (existingEvent.status !== 'ongoing') {
      return res.status(400).json({ message: 'Event is already completed' });
    }
    
    // Check if the updater exists
    const updater = await prisma.user.findUnique({
      where: { id: updaterId },
      select: { id: true }
    });
    
    if (!updater) {
      return res.status(404).json({ message: 'Updater not found' });
    }
    
    // Update the event and associated devices in a transaction
    await prisma.$transaction(async (prismaClient) => {
      // Update the event - phải dùng "completed" chứ không phải "Đã Hoàn Thành" theo schema
      await prismaClient.event.update({
        where: { id },
        data: {
          status: 'completed',
          returnedDate: new Date(),
          updaterId
        }
      });
      
      // Update the condition for each device
      for (const { deviceId, condition } of deviceConditions) {
        const eventDevice = existingEvent.eventDevices.find(ed => ed.deviceId === deviceId);
        
        if (eventDevice) {
          await prismaClient.eventDevice.update({
            where: { id: eventDevice.id },
            data: { condition }
          });
          
          // Reset device status to available
          await prismaClient.device.update({
            where: { id: deviceId },
            data: {
              status: 'available',
              borrowerId: null,
              eventId: null,
              borrowContext: null
            }
          });
        }
      }
    });
    
    // Fetch the updated event with optimized selection
    const updatedEvent = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        createdDate: true,
        returnedDate: true,
        creator: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        updater: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        eventDevices: {
          select: {
            id: true,
            condition: true,
            device: {
              select: {
                id: true,
                name: true,
                image: true,
                status: true
              }
            }
          }
        }
      }
    });
    
    return res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error returning devices:', error);
    return res.status(500).json({ message: 'Error returning devices: ' + error.message });
  }
}

// Delete an event
async function deleteEvent(req, res, id) {
  try {
    // Check if the event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { 
        id: true,
        status: true,
        eventDevices: {
          select: {
            deviceId: true
          }
        }
      }
    });
    
    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // If event is ongoing, we need to release devices
    if (existingEvent.status === 'ongoing') {
      await prisma.$transaction(async (prismaClient) => {
        // Release all devices connected to this event
        for (const { deviceId } of existingEvent.eventDevices) {
          await prismaClient.device.update({
            where: { id: deviceId },
            data: {
              status: 'available',
              borrowerId: null,
              eventId: null,
              borrowContext: null
            }
          });
        }
        
        // Delete the event (cascade will delete associated eventDevices)
        await prismaClient.event.delete({
          where: { id }
        });
      });
    } else {
      // If completed, just delete the event
      await prisma.event.delete({
        where: { id }
      });
    }
    
    return res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ message: 'Error deleting event: ' + error.message });
  }
}