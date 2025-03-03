import { getUserFromToken } from './auth';

// Middleware xác thực người dùng
export async function withAuth(handler) {
  return async (req, res) => {
    try {
      // Lấy token từ header Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Không có quyền truy cập' });
      }
      
      const token = authHeader.split(' ')[1];
      
      // Lấy thông tin người dùng từ token
      const user = await getUserFromToken(token);
      
      // Thêm thông tin người dùng vào request
      req.user = user;
      
      // Chuyển đến handler tiếp theo
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ message: 'Không có quyền truy cập' });
    }
  };
}

// Middleware xác thực quyền Admin
export async function withAdmin(handler) {
  return async (req, res) => {
    try {
      // Lấy token từ header Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Không có quyền truy cập' });
      }
      
      const token = authHeader.split(' ')[1];
      
      // Lấy thông tin người dùng từ token
      const user = await getUserFromToken(token);
      
      // Kiểm tra quyền admin
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
      }
      
      // Thêm thông tin người dùng vào request
      req.user = user;
      
      // Chuyển đến handler tiếp theo
      return handler(req, res);
    } catch (error) {
      console.error('Admin middleware error:', error);
      return res.status(401).json({ message: 'Không có quyền truy cập' });
    }
  };
}