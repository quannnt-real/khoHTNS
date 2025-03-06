import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials', 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'tokens', 'token.json');

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: 'Authorization code missing' });
  }

  try {
    // Đọc file credentials
    const content = fs.readFileSync(CREDENTIALS_PATH);
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;

    // Tạo OAuth client
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0] || `http://${req.headers.host}/api/auth/google/callback`
    );

    // Lấy token
    const { tokens } = await oAuth2Client.getToken(code);
    
    // Lưu token vào file
    fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

    // Chuyển hướng về trang test
    res.redirect('/test-google-email?auth=success');
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({ message: 'Failed to get tokens', error: error.message });
  }
}