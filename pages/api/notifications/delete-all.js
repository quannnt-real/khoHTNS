import { prisma } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
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
    
    // Delete all notifications for the user
    const result = await prisma.notification.deleteMany({
      where: { userId }
    });
    
    return res.status(200).json({
      success: true,
      message: 'All notifications deleted',
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    return res.status(500).json({ message: 'Error deleting notifications' });
  }
}