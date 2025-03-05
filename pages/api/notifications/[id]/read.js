import { prisma } from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Lấy token từ header
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
    const { id } = req.query;
    
    // Kiểm tra notification tồn tại và thuộc về user này
    const notification = await prisma.notification.findUnique({
      where: { id }
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    if (notification.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this notification' });
    }
    
    // Cập nhật trạng thái đã đọc
    await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ message: 'Error updating notification' });
  }
}