import { hash, compare } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'our-super-secret-jwt-key-for-qlkho';

// Hàm đăng ký người dùng mới
export async function registerUser({ name, phone, email, password, role = 'user' }) {
  // Kiểm tra email/số điện thoại đã tồn tại chưa
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone },
        { email: email || undefined }
      ]
    }
  });

  if (existingUser) {
    throw new Error('Số điện thoại hoặc email đã được sử dụng');
  }

  // Mã hóa mật khẩu
  const hashedPassword = await hash(password, 10);

  // Tạo người dùng mới
  const user = await prisma.user.create({
    data: {
      name,
      phone,
      email,
      password: hashedPassword,
      role
    }
  });

  // Tạo token JWT
  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role
    }
  };
}

// Hàm đăng nhập
export async function loginUser({ phone, password }) {
  // Tìm người dùng theo số điện thoại
  const user = await prisma.user.findUnique({
    where: { phone }
  });

  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }

  // Kiểm tra mật khẩu
  const isPasswordValid = await compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Sai mật khẩu');
  }

  // Tạo token JWT
  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role
    }
  };
}

// Tạo token JWT
function generateToken(user) {
  return sign(
    { 
      userId: user.id,
      role: user.role 
    }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
}

// Xác thực token JWT
export function verifyToken(token) {
  try {
    return verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token không hợp lệ');
  }
}

// Lấy thông tin người dùng từ token
export async function getUserFromToken(token) {
  try {
    const decoded = verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role
    };
  } catch (error) {
    throw new Error('Không thể xác thực người dùng');
  }
}

// Hàm khôi phục mật khẩu
export async function requestPasswordReset(phone) {
  // Tìm người dùng theo số điện thoại
  const user = await prisma.user.findUnique({
    where: { phone }
  });

  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }

  // Tạo mã reset ngẫu nhiên
  const resetToken = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
  
  // Thời hạn 1 giờ
  const resetTokenExpiry = new Date(Date.now() + 3600000);

  // Lưu mã reset vào database
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      resetToken, 
      resetTokenExpiry 
    }
  });

  // Trong thực tế, bạn sẽ gửi SMS mã này đến số điện thoại người dùng
  // Nhưng ở đây, chúng ta chỉ trả về nó để kiểm tra
  return resetToken;
}

// Hàm đặt lại mật khẩu
export async function resetPassword({ phone, token, newPassword }) {
  // Tìm người dùng có mã reset token hợp lệ và chưa hết hạn
  const user = await prisma.user.findFirst({
    where: {
      phone,
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    throw new Error('Token không hợp lệ hoặc đã hết hạn');
  }

  // Mã hóa mật khẩu mới
  const hashedPassword = await hash(newPassword, 10);

  // Cập nhật mật khẩu và xóa token
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    }
  });

  return { success: true };
}