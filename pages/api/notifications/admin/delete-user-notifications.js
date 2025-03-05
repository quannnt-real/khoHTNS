import { prisma } from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

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
    
    const { role } = decoded;
    
    // Check if the user is an admin
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can perform this action' });
    }
    
    // Get the target user ID from the query
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete all notifications for the specified user
    const result = await prisma.notification.deleteMany({
      where: { userId }
    });
    
    return res.status(200).json({
      success: true,
      message: `All notifications for user ${user.name} deleted`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error deleting user notifications:', error);
    return res.status(500).json({ message: 'Error deleting notifications' });
  }
}