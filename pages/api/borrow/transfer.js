import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  return transferDevice(req, res);
}

// Transfer a device from one user to another
async function transferDevice(req, res) {
  try {
    const { deviceId, fromUserId, toUserId } = req.body;
    
    // Validate required fields
    if (!deviceId || !fromUserId || !toUserId) {
      return res.status(400).json({ message: 'Device ID, current user ID, and new user ID are required' });
    }
    
    // Check if both users exist
    const [fromUser, toUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: fromUserId } }),
      prisma.user.findUnique({ where: { id: toUserId } })
    ]);
    
    if (!fromUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }
    
    if (!toUser) {
      return res.status(404).json({ message: 'New user not found' });
    }
    
    // Check if the device exists and is currently borrowed by the fromUser
    const device = await prisma.device.findUnique({
      where: { id: deviceId }
    });
    
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    if (device.status !== 'borrowed') {
      return res.status(400).json({ message: 'Device is not currently borrowed' });
    }
    
    if (device.borrowerId !== fromUserId) {
      return res.status(403).json({ message: 'Device is not borrowed by the specified user' });
    }
    
    // Find the latest borrow history record for this device
    const borrowHistory = await prisma.borrowHistory.findFirst({
      where: {
        deviceId,
        userId: fromUserId,
        returnDate: null
      },
      orderBy: { borrowDate: 'desc' }
    });
    
    if (!borrowHistory) {
      return res.status(404).json({ message: 'No active borrow record found for this device' });
    }
    
    // Process the transfer using a transaction
    await prisma.$transaction([
      // Create a return record for the current borrower
      prisma.borrowHistory.update({
        where: { id: borrowHistory.id },
        data: {
          returnDate: new Date(),
          transferToId: toUserId
        }
      }),
      
      // Create a new borrow record for the new borrower
      prisma.borrowHistory.create({
        data: {
          deviceId,
          userId: toUserId
        }
      }),
      
      // Update the device with the new borrower
      prisma.device.update({
        where: { id: deviceId },
        data: {
          borrowerId: toUserId
        }
      })
    ]);
    
    // Fetch and return the updated device
    const updatedDevice = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        borrower: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Device transferred successfully',
      device: updatedDevice
    });
  } catch (error) {
    console.error('Error transferring device:', error);
    return res.status(500).json({ message: 'Error transferring device' });
  }
}