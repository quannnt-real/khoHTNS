import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  const { id } = req.query;
  
  try {
    if (!id) {
      return res.status(400).json({ message: 'Transfer ID is required' });
    }
    
    const transfer = await prisma.borrowHistory.findUnique({
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
    
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer request not found' });
    }
    
    return res.status(200).json(transfer);
  } catch (error) {
    console.error('Error getting transfer details:', error);
    return res.status(500).json({ message: 'Error retrieving transfer details' });
  }
}