import { prisma } from '../../../lib/prisma';
import { sendEmail, generateNotificationEmail } from '../../../lib/emailService';
import { sendNotificationToUser } from '../../../lib/socketService';

export default async function handler(req, res) {
  // Accept both GET (from email links) and POST (from UI)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Get request ID and action from query params or request body
    const id = req.query.id || req.body.id;
    const action = req.query.action || req.body.action;
    
    if (!id) {
      return res.status(400).json({ message: 'Request ID is required' });
    }
    
    if (!action || (action !== 'accept' && action !== 'reject')) {
      return res.status(400).json({ message: 'Action must be either "accept" or "reject"' });
    }
    
    // Find the request
    const transferRequest = await prisma.borrowHistory.findUnique({
      where: { id },
      include: {
        device: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        transferTo: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        transferFrom: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      }
    });
    
    if (!transferRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Check if the request is still pending
    if (transferRequest.transferStatus !== 'pending') {
      return res.status(400).json({ 
        message: `This request has already been ${transferRequest.transferStatus}`
      });
    }
    
    // Determine the request type (transfer or borrow)
    const requestType = transferRequest.transferTo ? 'transfer' : 'borrow';
    
    // Update the request status
    await prisma.borrowHistory.update({
      where: { id },
      data: {
        transferStatus: action === 'accept' ? 'accepted' : 'rejected'
      }
    });
    
    // If accepted, process the transfer/borrow
    if (action === 'accept') {
      if (requestType === 'transfer') {
        // For transfer: update existing active borrowHistory, create new one, update device
        // Find the active borrow record for this device
        const activeBorrow = await prisma.borrowHistory.findFirst({
          where: {
            deviceId: transferRequest.deviceId,
            userId: transferRequest.userId,
            returnDate: null,
            id: { not: transferRequest.id } // Not this request
          },
          orderBy: { borrowDate: 'desc' }
        });
        
        // Process using a transaction
        await prisma.$transaction([
          // 1. Mark the current borrow as returned with a transfer
          prisma.borrowHistory.update({
            where: { id: activeBorrow.id },
            data: {
              returnDate: new Date(),
              transferToId: transferRequest.transferToId
            }
          }),
          
          // 2. Create a new borrow record for the recipient
          prisma.borrowHistory.create({
            data: {
              deviceId: transferRequest.deviceId,
              userId: transferRequest.transferToId,
              borrowContext: 'personal'
            }
          }),
          
          // 3. Update the device with the new borrower
          prisma.device.update({
            where: { id: transferRequest.deviceId },
            data: {
              borrowerId: transferRequest.transferToId
            }
          })
        ]);
      } else if (requestType === 'borrow') {
        // For borrow: update existing borrowHistory, create new one, update device
        // Find the active borrow record for this device
        const activeBorrow = await prisma.borrowHistory.findFirst({
          where: {
            deviceId: transferRequest.deviceId,
            userId: transferRequest.transferFromId,
            returnDate: null
          },
          orderBy: { borrowDate: 'desc' }
        });
        
        // Process using a transaction
        await prisma.$transaction([
          // 1. Mark the current borrow as returned with a transfer
          prisma.borrowHistory.update({
            where: { id: activeBorrow.id },
            data: {
              returnDate: new Date(),
              transferToId: transferRequest.userId
            }
          }),
          
          // 2. Create a new borrow record for the requester
          prisma.borrowHistory.create({
            data: {
              deviceId: transferRequest.deviceId,
              userId: transferRequest.userId,
              borrowContext: 'personal'
            }
          }),
          
          // 3. Update the device with the new borrower
          prisma.device.update({
            where: { id: transferRequest.deviceId },
            data: {
              borrowerId: transferRequest.userId
            }
          })
        ]);
      }
    }
    
    // Send notification emails to both parties
    const baseUrl = getBaseUrl(req);
    const device = await prisma.device.findUnique({
      where: { id: transferRequest.deviceId }
    });
    
    // Notify the requester/sender
    const requesterId = transferRequest.userId;
    
    // Tạo thông báo cho người yêu cầu
    const notificationTitle = action === 'accept' 
      ? `Yêu cầu ${requestType === 'transfer' ? 'chuyển' : 'mượn'} thiết bị được chấp nhận` 
      : `Yêu cầu ${requestType === 'transfer' ? 'chuyển' : 'mượn'} thiết bị bị từ chối`;
    
    const notificationMessage = action === 'accept'
      ? `Yêu cầu ${requestType === 'transfer' ? 'chuyển' : 'mượn'} thiết bị "${device.name}" đã được chấp nhận`
      : `Yêu cầu ${requestType === 'transfer' ? 'chuyển' : 'mượn'} thiết bị "${device.name}" đã bị từ chối`;
      
    const notification = await prisma.notification.create({
      data: {
        userId: requesterId,
        type: 'confirmation',
        title: notificationTitle,
        message: notificationMessage,
        metadata: JSON.stringify({
          requestId: id,
          deviceId: transferRequest.deviceId,
          action: action
        })
      }
    });
    
    // Gửi thông báo real-time qua Socket.IO
    sendNotificationToUser(requesterId, {
      ...notification,
      metadata: JSON.parse(notification.metadata || '{}')
    });
    
    // Gửi email thông báo
    if (transferRequest.user.email) {
      const emailContent = generateNotificationEmail({
        device,
        user: transferRequest.user,
        action: action === 'accept' ? 'accepted' : 'rejected',
        requestType,
        otherParty: requestType === 'transfer' ? transferRequest.transferTo : transferRequest.transferFrom,
        baseUrl
      });
      
      await sendEmail({
        to: transferRequest.user.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      });
    }
    
    // For UI responses, return more info
    if (req.method === 'POST') {
      return res.status(200).json({
        success: true,
        message: `Request ${action === 'accept' ? 'accepted' : 'rejected'} successfully`,
        requestId: id
      });
    }
    
    // For GET requests (email links), redirect to success page
    const statusParam = action === 'accept' ? 'accepted' : 'rejected';
    return res.redirect(`/transfers/confirmation?status=${statusParam}&id=${id}`);
    
  } catch (error) {
    console.error('Error confirming transfer request:', error);
    
    if (req.method === 'POST') {
      return res.status(500).json({ message: 'Error processing request' });
    }
    
    // For GET requests, redirect to error page
    return res.redirect('/transfers/confirmation?status=error');
  }
}

// Helper function to get the base URL
function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  return `${protocol}://${host}`;
}