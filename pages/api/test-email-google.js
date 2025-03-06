import { sendGoogleMail, isAuthenticated } from '../../lib/googleMailService';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Kiểm tra xác thực
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        return res.redirect('/api/auth/google');
      }
      
      return res.status(200).json({ message: 'Authenticated successfully. Ready to send emails.' });
    } catch (error) {
      console.error("GET error:", error);
      return res.status(500).json({ message: 'Server error checking authentication', error: error.message });
    }
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Kiểm tra xác thực
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return res.status(401).json({ message: 'Not authenticated with Google. Please visit /api/auth/google first.' });
    }
    
    // Gửi email và trả về kết quả
    const result = await sendGoogleMail({
      to: req.body.email || 'test@example.com',
      subject: 'Test Email - Hệ thống Kho HTNS',
      text: 'Đây là email kiểm tra từ hệ thống Kho HTNS.',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email - Kho HTNS</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }
            .header {
              text-align: center;
              padding: 20px 0;
              border-bottom: 1px solid #eaeaea;
            }
            .logo {
              width: 120px;
              height: auto;
              margin-bottom: 15px;
            }
            h1 {
              color: #4f46e5;
              font-size: 24px;
              font-weight: 700;
              margin: 0;
            }
            .content {
              padding: 30px 20px;
            }
            .card {
              background-color: #f0f9ff;
              border-left: 4px solid #4f46e5;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .success-icon {
              text-align: center;
              font-size: 48px;
              margin: 20px 0;
              color: #10b981;
            }
            .button {
              display: inline-block;
              background-color: #4f46e5;
              color: #ffffff;
              text-decoration: none;
              padding: 10px 20px;
              border-radius: 4px;
              font-weight: 500;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              padding-top: 20px;
              margin-top: 30px;
              border-top: 1px solid #eaeaea;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div style="font-size: 36px; color: #4f46e5;">📦</div>
              <h1>Kho HTNS</h1>
              <p style="color: #6b7280;">Hệ thống Quản lý Thiết bị</p>
            </div>
            
            <div class="content">
              <div class="success-icon">✓</div>
              <h2>Email Kiểm Tra Thành Công</h2>
              
              <p>Xin chào,</p>
              
              <p>Email này xác nhận rằng cấu hình gửi mail của bạn đang hoạt động tốt!</p>
              
              <div class="card">
                <strong>Thông tin hệ thống:</strong>
                <ul>
                  <li>Thời gian kiểm tra: ${new Date().toLocaleString('vi-VN')}</li>
                  <li>API: Google Gmail API</li>
                  <li>Tình trạng: Hoạt động</li>
                </ul>
              </div>
              
              <p>Giờ đây bạn có thể:</p>
              <ul>
                <li>Gửi thông báo đến người dùng</li>
                <li>Thông báo về việc mượn/trả thiết bị</li>
                <li>Gửi xác nhận đăng ký tài khoản</li>
              </ul>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="http://localhost:3001/dashboard" class="button" style="color:#fff">Quay lại Bảng Điều Khiển</a>
              </div>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} - Hệ thống Kho HTNS</p>
              <p>Email này được gửi tự động để kiểm tra cấu hình. Vui lòng không trả lời.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    // Trả về kết quả cho client
    if (result.success) {
      res.status(200).json({ message: 'Email sent successfully', messageId: result.messageId });
    } else {
      res.status(500).json({ message: 'Failed to send email', error: result.error });
    }
  } catch (error) {
    console.error('Error in test-email-google API:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}