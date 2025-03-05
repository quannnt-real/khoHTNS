import { prisma } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
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
    
    const { userId } = decoded;
    
    // Mark all of the user's notifications as read
    const result = await prisma.notification.updateMany({
      where: { 
        userId,
        read: false
      },
      data: { read: true }
    });
    
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      updatedCount: result.count
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ message: 'Error marking notifications as read' });
  }
}