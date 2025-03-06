import path from 'path';
import fs from 'fs';

export default function handler(req, res) {
  const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials', 'credentials.json');
  const TOKEN_PATH = path.join(process.cwd(), 'tokens', 'token.json');

  try {
    // Kiểm tra thư mục credentials
    const credentialsDir = path.join(process.cwd(), 'credentials');
    const credentialsDirExists = fs.existsSync(credentialsDir);
    
    // Kiểm tra file credentials.json
    const credentialsFileExists = fs.existsSync(CREDENTIALS_PATH);
    
    // Kiểm tra thư mục tokens
    const tokensDir = path.join(process.cwd(), 'tokens');
    const tokensDirExists = fs.existsSync(tokensDir);
    
    // Kiểm tra file token.json
    const tokenFileExists = fs.existsSync(TOKEN_PATH);
    
    return res.status(200).json({
      status: 'success',
      checks: {
        credentialsDir: { exists: credentialsDirExists, path: credentialsDir },
        credentialsFile: { exists: credentialsFileExists, path: CREDENTIALS_PATH },
        tokensDir: { exists: tokensDirExists, path: tokensDir },
        tokenFile: { exists: tokenFileExists, path: TOKEN_PATH }
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}