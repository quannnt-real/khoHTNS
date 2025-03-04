import { prisma } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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
    const { deviceId } = req.query;
    
    // Base query: get all pending requests relevant to this user
    let whereClause = {
      transferStatus: 'pending',
      OR: [
        { userId }, // Requests created by this user
        { transferToId: userId }, // Transfer requests to this user
        { transferFromId: userId } // Borrow requests from this user
      ]
    };
    
    // If deviceId is provided, filter by that too
    if (deviceId) {
      whereClause.deviceId = deviceId;
    }
    
    const pendingRequests = await prisma.borrowHistory.findMany({
      where: whereClause,
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
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.status(200).json({ requests: pendingRequests });
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return res.status(500).json({ message: 'Error retrieving pending requests' });
  }
}