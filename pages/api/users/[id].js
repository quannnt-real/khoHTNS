import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
  }

  switch (req.method) {
    case 'GET':
      return getUser(req, res, id);
    case 'PUT':
      return updateUser(req, res, id);
    case 'DELETE':
      return deleteUser(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getUser(req, res, userId) {
  try {
    // Get user info with borrowed devices and history
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        borrowedDevices: {
          include: {
            borrowHistory: {
              orderBy: { borrowDate: 'desc' },
              take: 1
            }
          }
        },
        borrowHistory: {
          orderBy: { borrowDate: 'desc' },
          include: {
            device: {
              select: {
                id: true,
                name: true,
                image: true
              }
            },
            transferTo: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Remove sensitive information
    const { password, resetToken, resetTokenExpiry, ...safeUser } = user;

    return res.status(200).json(safeUser);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ 
      message: 'Lỗi khi lấy thông tin người dùng',
      error: error.message
    });
  }
}

async function updateUser(req, res, userId) {
  try {
    // Extract request body
    const { name, phone, email, role } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({ message: 'Tên và số điện thoại là bắt buộc' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Check if phone number is already in use by another user
    if (phone !== existingUser.phone) {
      const phoneExists = await prisma.user.findUnique({
        where: { phone }
      });

      if (phoneExists) {
        return res.status(400).json({ message: 'Số điện thoại đã được sử dụng bởi người dùng khác' });
      }
    }

    // Check if email is already in use by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({ message: 'Email đã được sử dụng bởi người dùng khác' });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        email,
        role: role || existingUser.role // Only update role if provided
      }
    });

    // Remove sensitive information
    const { password, resetToken, resetTokenExpiry, ...safeUser } = updatedUser;

    return res.status(200).json({
      message: 'Cập nhật thông tin người dùng thành công',
      user: safeUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        message: 'Số điện thoại hoặc email đã tồn tại trong hệ thống' 
      });
    }
    
    return res.status(500).json({ 
      message: 'Lỗi khi cập nhật thông tin người dùng',
      error: error.message
    });
  }
}

async function deleteUser(req, res, userId) {
  try {
    // Kiểm tra user tồn tại và lấy thông tin về thiết bị đang mượn
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        borrowedDevices: true,
      }
    });

    if (!user) {
      return res.status(404).json({ 
        message: 'Không tìm thấy người dùng' 
      });
    }

    // Kiểm tra thiết bị đang mượn
    if (user.borrowedDevices.length > 0) {
      return res.status(400).json({ 
        message: `Không thể xóa người dùng đang mượn ${user.borrowedDevices.length} thiết bị`,
        devices: user.borrowedDevices.length
      });
    }

    // Xóa theo thứ tự để tránh lỗi khóa ngoại
    await prisma.$transaction([
      // Xóa lịch sử mượn trả
      prisma.borrowHistory.deleteMany({
        where: { 
          OR: [
            { userId: userId },
            { transferToId: userId },
            { transferFromId: userId }
          ]
        }
      }),
      // Xóa các sự kiện liên quan
      prisma.event.deleteMany({
        where: {
          OR: [
            { creatorId: userId },
            { updaterId: userId }
          ]
        }
      }),
      // Cuối cùng xóa user
      prisma.user.delete({
        where: { id: userId }
      })
    ]);

    return res.status(200).json({ 
      message: 'Xóa người dùng thành công',
      deletedUser: user.name
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ 
      message: 'Lỗi khi xóa người dùng',
      error: error.message
    });
  }
}
