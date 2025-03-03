import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    // console.log('Fetching event:', id);

    const event = await prisma.event.findUnique({
      where: { id },
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
                image: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (!event) {
      // console.log('Event not found:', id);
      return res.status(404).json({ 
        message: 'Không tìm thấy sự kiện' 
      });
    }

    // console.log('Event found:', event.id);
    return res.json(event);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Lỗi khi tải thông tin sự kiện',
      error: error.message 
    });
  }
}

// Update an event (return ticket)
async function updateEvent(req, res, id) {
  try {
    const { updaterId, deviceConditions } = req.body;
    
    // Validate required fields
    if (!updaterId || !deviceConditions) {
      return res.status(400).json({ message: 'Updater ID and device conditions are required' });
    }
    
    // Check if the event exists and is ongoing
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        eventDevices: true
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
      where: { id: updaterId }
    });
    
    if (!updater) {
      return res.status(404).json({ message: 'Updater not found' });
    }
    
    // Update the event and associated devices in a transaction
    await prisma.$transaction(async (prismaClient) => {
      // Update the event
      await prismaClient.event.update({
        where: { id },
        data: {
          status: 'Đã Hoàn Thành',
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
        }
      }
    });
    
    // Fetch the updated event
    const updatedEvent = await prisma.event.findUnique({
      where: { id },
      include: {
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
          include: {
            device: true
          }
        }
      }
    });
    
    return res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ message: 'Error updating event' });
  }
}

// Delete an event
async function deleteEvent(req, res, id) {
  try {
    // Check if the event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });
    
    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Delete the event (cascade will delete associated eventDevices)
    await prisma.event.delete({
      where: { id }
    });
    
    return res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ message: 'Error deleting event' });
  }
}