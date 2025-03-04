import { prisma } from '../../../lib/prisma';
import { sendEmail, generateTransferRequestEmail, generateBorrowRequestEmail } from '../../../lib/emailService';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Verify authorization token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    let decoded;
    
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    const { userId } = decoded;
    
    // Check request type (transfer or borrow)
    const { deviceId, toUserId, requestType } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ message: 'Device ID is required' });
    }
    
    // Get device information
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        borrower: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      }
    });
    
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    // Handle transfer request (from current borrower to another user)
    if (requestType === 'transfer') {
      if (!toUserId) {
        return res.status(400).json({ message: 'Recipient user ID is required for transfer requests' });
      }
      
      // Check if user is the current borrower
      if (device.borrowerId !== userId) {
        return res.status(403).json({ message: 'Only the current borrower can transfer a device' });
      }
      
      const recipient = await prisma.user.findUnique({
        where: { id: toUserId },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true
        }
      });
      
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient user not found' });
      }
      
      // If recipient has no email, we can't send notifications
      if (!recipient.email) {
        return res.status(400).json({ 
          message: 'Recipient user has no email address. Email notifications are required for transfers.'
        });
      }
      
      // Create a transfer request
      const transferRequest = await prisma.borrowHistory.create({
        data: {
          deviceId: device.id,
          userId: userId,
          transferToId: toUserId,
          transferStatus: 'pending',
          borrowContext: 'personal'
        }
      });
      
      // Send email notification to the recipient
      if (recipient.email) {
        const sender = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        });
        
        const baseUrl = getBaseUrl(req);
        const emailContent = generateTransferRequestEmail({
          device,
          sender,
          recipient,
          transferId: transferRequest.id,
          baseUrl
        });
        
        await sendEmail({
          to: recipient.email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Transfer request sent successfully',
        transferId: transferRequest.id
      });
    }
    
    // Handle borrow request (from a non-borrower to the current borrower)
    if (requestType === 'borrow') {
      // Check if device is already borrowed
      if (device.status !== 'borrowed') {
        return res.status(400).json({ message: 'Device is not currently borrowed' });
      }
      
      // Check if user is not the current borrower
      if (device.borrowerId === userId) {
        return res.status(400).json({ message: 'You already have this device' });
      }
      
      // If borrower has no email, we can't send notifications
      if (!device.borrower.email) {
        return res.status(400).json({ 
          message: 'Current borrower has no email address. Email notifications are required for borrow requests.'
        });
      }
      
      const requester = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true
        }
      });
      
      // Create a borrow request
      const borrowRequest = await prisma.borrowHistory.create({
        data: {
          deviceId: device.id,
          userId: userId,
          transferFromId: device.borrowerId,
          transferStatus: 'pending',
          borrowContext: 'personal'
        }
      });
      
      // Send email notification to the current borrower
      if (device.borrower.email) {
        const baseUrl = getBaseUrl(req);
        const emailContent = generateBorrowRequestEmail({
          device,
          requester,
          owner: device.borrower,
          requestId: borrowRequest.id,
          baseUrl
        });
        
        await sendEmail({
          to: device.borrower.email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Borrow request sent successfully',
        requestId: borrowRequest.id
      });
    }
    
    return res.status(400).json({ message: 'Invalid request type' });
    
  } catch (error) {
    console.error('Error processing transfer request:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Helper function to get the base URL
function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  return `${protocol}://${host}`;
}