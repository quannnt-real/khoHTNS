import { requestPasswordReset, resetPassword } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { phone, token, newPassword } = req.body;

    // If token and newPassword are not provided, this is a request for a reset token
    if (!token || !newPassword) {
      // Validate required fields for reset request
      if (!phone) {
        return res.status(400).json({ message: 'Số điện thoại là bắt buộc' });
      }

      // Request password reset token
      const resetToken = await requestPasswordReset(phone);

      // In a real application, you would send this token via SMS
      // For testing purposes, we return it
      return res.status(200).json({ 
        message: 'Mã khôi phục mật khẩu đã được gửi đến số điện thoại của bạn',
        token: resetToken // Remove this in production
      });
    } else {
      // This is a password reset with token
      // Validate required fields for reset
      if (!phone || !token || !newPassword) {
        return res.status(400).json({ 
          message: 'Số điện thoại, mã xác nhận và mật khẩu mới là bắt buộc' 
        });
      }

      // Validate password strength
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
      }

      // Reset the password
      const result = await resetPassword({ phone, token, newPassword });

      return res.status(200).json({ 
        message: 'Mật khẩu đã được thay đổi thành công'
      });
    }
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(400).json({ message: error.message || 'Khôi phục mật khẩu không thành công' });
  }
}