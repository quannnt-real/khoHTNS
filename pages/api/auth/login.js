import { loginUser } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { phone, password } = req.body;

    // Validate required fields
    if (!phone || !password) {
      return res.status(400).json({ message: 'Số điện thoại và mật khẩu là bắt buộc' });
    }

    // Login user
    const result = await loginUser({ phone, password });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(401).json({ message: error.message || 'Đăng nhập không thành công' });
  }
}