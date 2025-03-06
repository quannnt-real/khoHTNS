import { sendGoogleMail } from './googleMailService';

/**
 * Hàm gửi email thống nhất - sẽ sử dụng Gmail API thay vì SMTP
 * @param {Object} options - Tùy chọn email
 * @param {string} options.to - Email người nhận
 * @param {string} options.subject - Tiêu đề email
 * @param {string} options.text - Nội dung text
 * @param {string} options.html - Nội dung HTML
 * @returns {Promise<Object>} - Kết quả gửi email
 */
export async function sendEmail({ to, subject, text, html }) {
  // Ghi log nội dung email (giữ lại từ emailService.js)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Sending email to:', to);
    console.log('Subject:', subject);
    console.log('Content:', text);
    console.log('==============================');
  }

  // Gửi email qua Gmail API thay vì SMTP
  try {
    const result = await sendGoogleMail({ to, subject, text, html });
    
    if (process.env.NODE_ENV !== 'production' && result.success) {
      console.log('Email sent with Gmail API:', result.messageId);
    }
    
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Export lại tất cả các hàm từ emailService để sử dụng template
export {
  generateTransferRequestEmail,
  generateBorrowRequestEmail,
  generateNotificationEmail,
  generateNewAccountEmail,
} from './emailService';

/**
 * Gửi email thông báo tài khoản mới cho người dùng (sử dụng Gmail API)
 */
export async function sendNewAccountEmail(user, password) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const { generateNewAccountEmail } = require('./emailService');
  const emailContent = generateNewAccountEmail({ user, password, baseUrl });
  
  return sendEmail({
    to: user.email,
    ...emailContent
  });
}

/**
 * Gửi yêu cầu chuyển thiết bị (sử dụng Gmail API)
 */
export async function sendDeviceTransferRequest({ toUser, fromUser, device, requestId, requestType = 'transfer', message = '' }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const { sendDeviceTransferRequest: generateTransferRequest } = require('./emailService');
  
  // Gọi hàm gốc để tạo nội dung email
  return generateTransferRequest({ 
    toUser, 
    fromUser, 
    device, 
    requestId,
    requestType,
    message,
    baseUrl: appUrl
  });
}