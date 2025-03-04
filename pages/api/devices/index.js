import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getDevices(req, res);
    case 'POST':
      return createDevice(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Lấy danh sách thiết bị
async function getDevices(req, res) {
  try {
    const { search, status } = req.query;
    
    let whereClause = {};
    
    // Tìm kiếm theo tên/ghi chú
    if (search) {
      whereClause = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ],
      };
    }
    
    // Lọc theo trạng thái nếu có
    if (status) {
      whereClause = {
        ...whereClause,
        status,
      };
    }
    
    const devices = await prisma.device.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        image: true,
        status: true,
        purchaseDate: true,
        warrantyEnd: true,
        borrower: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        borrowContext: true,
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return res.status(200).json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    return res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
}

// Tạo thiết bị mới
async function createDevice(req, res) {
  try {
    const { 
      name, 
      image, 
      locationImage, 
      purchaseDate, 
      warrantyEnd, 
      warrantyPlace, 
      notes 
    } = req.body;

    // Xác thực dữ liệu đầu vào
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Tên thiết bị là bắt buộc' });
    }

    // Tạo thiết bị mới trong cơ sở dữ liệu
    const newDevice = await prisma.device.create({
      data: {
        name,
        image: image || null,
        locationImage: locationImage || null,
        purchaseDate: purchaseDate || null,
        warrantyEnd: warrantyEnd || null,
        warrantyPlace: warrantyPlace || null,
        notes: notes || null,
        status: 'available', // Thiết bị mới luôn có trạng thái available
      }
    });

    return res.status(201).json({ 
      message: 'Tạo thiết bị thành công',
      device: newDevice 
    });

  } catch (error) {
    console.error('Error creating device:', error);
    return res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
}