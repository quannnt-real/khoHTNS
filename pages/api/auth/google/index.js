import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Đường dẫn tới file credentials và token
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials', 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'tokens', 'token.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/userinfo.email'];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Kiểm tra nếu đã xác thực
    if (fs.existsSync(TOKEN_PATH)) {
      return res.redirect('/api/test-email-google?auth=success');
    }

    // Đọc file credentials
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      return res.status(500).json({ message: 'Credentials file not found' });
    }

    const content = fs.readFileSync(CREDENTIALS_PATH);
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;

    // Tạo OAuth client
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0] || `http://${req.headers.host}/api/auth/google/callback`
    );

    // Tạo URL xác thực
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent' // Đảm bảo luôn nhận được refresh token
    });

    // Chuyển hướng đến trang xác thực Google
    res.redirect(authUrl);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}