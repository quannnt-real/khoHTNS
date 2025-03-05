import { sendEmail } from '../../lib/emailService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const result = await sendEmail({
      to: req.body.email || 'test@example.com',
      subject: 'Kiểm tra gửi email từ Kho HTNS',
      text: 'Đây là email kiểm tra từ hệ thống Kho HTNS.',
      html: '<h1>Kiểm tra email</h1><p>Nếu bạn nhận được email này, cấu hình SMTP đã hoạt động đúng!</p>'
    });

    if (result.success) {
      res.status(200).json({ message: 'Email sent successfully', messageId: result.messageId });
    } else {
      res.status(500).json({ message: 'Failed to send email', error: result.error });
    }
  } catch (error) {
    console.error('Error in test-email API:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}