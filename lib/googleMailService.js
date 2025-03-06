import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// Đường dẫn tới file credentials và token
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials', 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'tokens', 'token.json');

// Scope quyền cần thiết cho Gmail API
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email'
];

/**
 * Hàm xác thực và lấy client API
 * @returns {Promise<google.auth.OAuth2>}
 */
async function authorize() {
  try {
    // Đọc thông tin từ file credentials
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error(`Credentials file not found at: ${CREDENTIALS_PATH}`);
    }
    
    const credentialsContent = fs.readFileSync(CREDENTIALS_PATH);
    const credentials = JSON.parse(credentialsContent);
    
    // Lấy thông tin client_id và client_secret từ file credentials
    const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;
    
    // Tạo OAuth client
    const oAuth2Client = new google.auth.OAuth2(
      client_id, 
      client_secret, 
      redirect_uris[0] || 'http://localhost:3001/api/auth/google/callback'
    );
    
    // Kiểm tra nếu có token lưu trữ
    if (fs.existsSync(TOKEN_PATH)) {
      const tokenContent = fs.readFileSync(TOKEN_PATH, 'utf-8');
      const token = JSON.parse(tokenContent);
      
      // Thiết lập token cho OAuth client
      oAuth2Client.setCredentials(token);
      return oAuth2Client;
    } else {
      // Nếu không có token, thực hiện xác thực mới
      const client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
      });
      
      // Lưu token vào file để sử dụng lần sau
      if (client.credentials) {
        const content = JSON.stringify(client.credentials);
        fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
        fs.writeFileSync(TOKEN_PATH, content);
      }
      
      return client;
    }
  } catch (error) {
    console.error('Authorization error:', error);
    throw error;
  }
}

/**
 * Tạo và gửi email qua Gmail API
 * @param {Object} options - Tùy chọn email
 * @param {string} options.to - Địa chỉ email người nhận
 * @param {string} options.subject - Tiêu đề email
 * @param {string} options.text - Nội dung văn bản plain
 * @param {string} options.html - Nội dung HTML (nếu có)
 * @returns {Promise<Object>} - Kết quả gửi email
 */
export async function sendGoogleMail({ to, subject, text, html }) {
  try {
    // Xác thực và lấy đối tượng auth
    const auth = await authorize();
    
    // Tạo đối tượng Gmail API
    const gmail = google.gmail({ version: 'v1', auth });
    
    // Đơn giản hóa nội dung email - không cần FROM
    const emailLines = [];
    emailLines.push('Content-Type: text/html; charset=utf-8');
    emailLines.push('MIME-Version: 1.0');
    emailLines.push(`To: ${to}`);
    // Quan trọng: Đối với subject tiếng Việt, cần encode theo chuẩn RFC2047
    const encodedSubject = '=?UTF-8?B?' + Buffer.from(subject).toString('base64') + '?=';
    emailLines.push(`Subject: ${encodedSubject}`);
    emailLines.push('');
    emailLines.push(html || text);

    const email = emailLines.join('\r\n');

    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Gửi email với userId='me'
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
    
    return {
      success: true,
      messageId: res.data.id,
    };
  } catch (error) {
    console.error('Error sending email with Google API:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Kiểm tra nếu đã xác thực
 * @returns {Promise<boolean>} - True nếu đã xác thực, false nếu chưa
 */
export async function isAuthenticated() {
  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error(`Credentials file not found at: ${CREDENTIALS_PATH}`);
      return false;
    }
    
    return fs.existsSync(TOKEN_PATH);
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

// Thêm hàm mới
async function getUserEmail(auth) {
  try {
    const oauth2 = google.oauth2({
      auth,
      version: 'v2'
    });
    
    const { data } = await oauth2.userinfo.get();
    return data.email;
  } catch (error) {
    console.error('Error fetching user email:', error);
    return 'noreply@khohtns.com'; // Email dự phòng
  }
}