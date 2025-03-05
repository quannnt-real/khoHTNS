import { prisma } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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
    const { limit, page, pageSize } = req.query;
    
    // Xác định limit, pagination nếu có
    const take = limit ? parseInt(limit) : pageSize ? parseInt(pageSize) : undefined;
    const skip = page && pageSize ? (parseInt(page) - 1) * parseInt(pageSize) : undefined;
    
    // Lấy tổng số thông báo (cho pagination)
    const total = await prisma.notification.count({
      where: { userId }
    });
    
    // Lấy các thông báo của người dùng
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: take,
      skip: skip
    });
    
    return res.status(200).json({
      success: true,
      notifications,
      total,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : notifications.length
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    return res.status(500).json({ message: 'Error retrieving notifications' });
  }
}