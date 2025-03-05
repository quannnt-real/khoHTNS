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
    
    // Base query: get latest request for each device based on status priority
    // Pending (0) > Accepted (1) > Rejected (2)
    let whereClause = {
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
    
    // Lấy tất cả yêu cầu liên quan đến thiết bị và người dùng
    const allRequests = await prisma.borrowHistory.findMany({
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
      orderBy: [
        { deviceId: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    
    // Tạo map để nhóm yêu cầu theo thiết bị
    const deviceRequestsMap = new Map();
    
    // Ưu tiên theo trạng thái: pending > accepted > rejected
    const statusPriority = {
      'pending': 0,
      'accepted': 1,
      'rejected': 2
    };
    
    // Nhóm các yêu cầu theo thiết bị và ưu tiên theo trạng thái
    allRequests.forEach(request => {
      const deviceId = request.deviceId;
      
      if (!deviceRequestsMap.has(deviceId)) {
        deviceRequestsMap.set(deviceId, request);
        return;
      }
      
      const existingRequest = deviceRequestsMap.get(deviceId);
      const existingPriority = statusPriority[existingRequest.transferStatus] || 999;
      const currentPriority = statusPriority[request.transferStatus] || 999;
      
      // Nếu yêu cầu hiện tại có ưu tiên cao hơn (số nhỏ hơn)
      // hoặc cùng ưu tiên nhưng mới hơn thì thay thế
      if (
        currentPriority < existingPriority || 
        (currentPriority === existingPriority && request.createdAt > existingRequest.createdAt)
      ) {
        deviceRequestsMap.set(deviceId, request);
      }
    });
    
    // Lấy ra danh sách yêu cầu đã được lọc
    const filteredRequests = Array.from(deviceRequestsMap.values());
    
    // Sắp xếp lại theo thời gian tạo giảm dần
    filteredRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return res.status(200).json({ requests: filteredRequests });
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return res.status(500).json({ message: 'Error retrieving pending requests' });
  }
}