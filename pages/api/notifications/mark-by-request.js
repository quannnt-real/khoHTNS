import { prisma } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  // Chỉ chấp nhận phương thức PUT
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Xác thực token
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
    const { requestId } = req.body;
    
    if (!requestId) {
      return res.status(400).json({ message: 'requestId is required' });
    }
    
    // Tìm tất cả thông báo liên quan đến yêu cầu này cho người dùng hiện tại
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        metadata: {
          contains: requestId
        }
      }
    });
    
    if (notifications.length === 0) {
      return res.status(200).json({ message: 'No notifications found for this request' });
    }
    
    // Đánh dấu tất cả thông báo là đã đọc
    await prisma.notification.updateMany({
      where: {
        id: {
          in: notifications.map(n => n.id)
        }
      },
      data: {
        read: true
      }
    });
    
    return res.status(200).json({ 
      message: 'Notifications marked as read successfully',
      count: notifications.length
    });
    
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return res.status(500).json({ message: 'Error marking notifications as read' });
  }
}