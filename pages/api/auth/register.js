import { registerUser } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, phone, email, password } = req.body;

    // Validate required fields
    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Tên, số điện thoại và mật khẩu là bắt buộc' });
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Email không hợp lệ' });
      }
    }

    // Validate password strength (at least 6 characters)
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Register new user
    const result = await registerUser({ name, phone, email, password });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(400).json({ message: error.message || 'Đăng ký không thành công' });
  }
}