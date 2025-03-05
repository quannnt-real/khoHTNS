import { prisma } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'Notification ID is required' });
  }
  
  // Verify the user's token
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
  
  const { userId, role } = decoded;
  
  // Handle different HTTP methods
  switch (req.method) {
    case 'DELETE':
      return deleteNotification(req, res, id, userId, role);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function deleteNotification(req, res, notificationId, userId, role) {
  try {
    // First check if the notification exists and belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if user is authorized to delete this notification
    if (notification.userId !== userId && role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to delete this notification' });
    }
    
    // Delete the notification
    await prisma.notification.delete({
      where: { id: notificationId }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ message: 'Error deleting notification' });
  }
}