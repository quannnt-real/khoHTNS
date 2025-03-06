import nodemailer from 'nodemailer';

// Tạo transporter với thông tin SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // true cho port 465, false cho các port khác
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, text, html }) {
  // Ghi log nội dung email (có thể bỏ ở môi trường production)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Sending email to:', to);
    console.log('Subject:', subject);
    console.log('Content:', text);
    console.log('==============================');
  }

  try {
    // Cấu hình email
    const mailOptions = {
      from: `"Kho HTNS" <${process.env.SMTP_USER}>`, // Địa chỉ người gửi
      to, // Người nhận
      subject, // Tiêu đề
      text, // Nội dung text
      html, // Nội dung HTML
    };

    // Gửi email
    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email sent:', info.messageId);
      // URL xem trước (chỉ hoạt động với một số nhà cung cấp SMTP)
      if (info.preview) {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generates a device transfer request email
 * @param {Object} params - Email parameters
 * @param {Object} params.device - Device details
 * @param {Object} params.sender - User sending the transfer
 * @param {Object} params.recipient - User receiving the transfer
 * @param {string} params.transferId - Transfer ID for confirmation
 * @param {string} params.baseUrl - Base URL of the application
 * @returns {Object} - Email content object with subject, text and html
 */
export function generateTransferRequestEmail({ device, sender, recipient, transferId, baseUrl }) {
  const confirmUrl = `${baseUrl}/api/transfers/confirm?id=${transferId}&action=accept`;
  const rejectUrl = `${baseUrl}/api/transfers/confirm?id=${transferId}&action=reject`;
  
  const subject = `[Kho HTNS] Yêu cầu xác nhận chuyển thiết bị: ${device.name}`;
  
  const text = `
    Xin chào ${recipient.name},

    ${sender.name} muốn chuyển thiết bị "${device.name}" cho bạn.

    Thiết bị: ${device.name}
    Người chuyển: ${sender.name} (${sender.phone})
    Thời gian yêu cầu: ${new Date().toLocaleString('vi-VN')}

    Để xác nhận: ${confirmUrl}
    Để từ chối: ${rejectUrl}

    Email này được gửi tự động từ hệ thống Kho HTNS.
  `;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .container {
          border: 1px solid #e1e1e1;
          border-radius: 5px;
          padding: 20px;
          margin: 20px auto 0;
          max-width: 600px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 5px;
          border-left: 4px solid #4f46e5;
        }
        .device-info {
          background-color: #f0f9ff;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .actions {
          display: flex;
          margin-top: 30px;
          margin-bottom: 20px;
        }
        .btn {
          display: inline-block;
          padding: 10px 15px;
          margin-right: 10px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          text-align: center;
        }
        .btn-accept {
          background-color: #10b981;
          color: white!important;
        }
        .btn-reject {
          background-color: #ef4444;
          color: white!important;
        }
        .footer {
          font-size: 12px;
          color: #6b7280;
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Yêu cầu xác nhận chuyển thiết bị</h2>
        </div>
        
        <p>Xin chào <strong>${recipient.name}</strong>,</p>
        
        <p><strong>${sender.name}</strong> muốn chuyển thiết bị sau cho bạn:</p>
        
        <div class="device-info">
          <p><strong>Thiết bị:</strong> ${device.name}</p>
          <p><strong>Người chuyển:</strong> ${sender.name} (${sender.phone})</p>
          <p><strong>Thời gian yêu cầu:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        </div>
        
        <p>Vui lòng xác nhận nếu bạn muốn nhận thiết bị này:</p>
        
        <div class="actions">
          <a href="${confirmUrl}" class="btn btn-accept">Xác nhận</a>
          <a href="${rejectUrl}" class="btn btn-reject">Từ chối</a>
        </div>
        
        <p>Hoặc bạn có thể sử dụng các đường dẫn sau:</p>
        <p>
          <span>Xác nhận nhận thiết bị:</span> <a href="${confirmUrl}">${confirmUrl}</a><br>
          <span>Từ chối nhận thiết bị</span> <a href="${rejectUrl}">${rejectUrl}</a>
        </p>
        
        <div class="footer">
          <p>Email này được gửi tự động từ hệ thống Kho HTNS. Vui lòng không trả lời email này.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, text, html };
}

/**
 * Generates a device borrow request email
 * @param {Object} params - Email parameters
 * @param {Object} params.device - Device details
 * @param {Object} params.requester - User requesting to borrow
 * @param {Object} params.owner - Current device owner
 * @param {string} params.requestId - Request ID for confirmation
 * @param {string} params.baseUrl - Base URL of the application
 * @returns {Object} - Email content object with subject, text and html
 */
export function generateBorrowRequestEmail({ device, requester, owner, requestId, baseUrl }) {
  const confirmUrl = `${baseUrl}/api/transfers/confirm?id=${requestId}&action=accept`;
  const rejectUrl = `${baseUrl}/api/transfers/confirm?id=${requestId}&action=reject`;
  
  const subject = `[Kho HTNS] Yêu cầu mượn thiết bị: ${device.name}`;
  
  const text = `
    Xin chào ${owner.name},

    ${requester.name} muốn mượn thiết bị "${device.name}" từ bạn.

    Thiết bị: ${device.name}
    Người yêu cầu: ${requester.name} (${requester.phone})
    Thời gian yêu cầu: ${new Date().toLocaleString('vi-VN')}

    Để xác nhận: ${confirmUrl}
    Để từ chối: ${rejectUrl}

    Email này được gửi tự động từ hệ thống Kho HTNS.
  `;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .container {
          border: 1px solid #e1e1e1;
          border-radius: 5px;
          padding: 20px;
          margin: 20px auto 0;
          max-width: 600px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 5px;
          border-left: 4px solid #4f46e5;
        }
        .device-info {
          background-color: #f0f9ff;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .actions {
          display: flex;
          margin-top: 30px;
          margin-bottom: 20px;
        }
        .btn {
          display: inline-block;
          padding: 10px 15px;
          margin-right: 10px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          text-align: center;
        }
        .btn-accept {
          background-color: #10b981;
          color: white!important;
        }
        .btn-reject {
          background-color: #ef4444;
          color: white!important;
        }
        .footer {
          font-size: 12px;
          color: #6b7280;
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Yêu cầu mượn thiết bị</h2>
        </div>
        
        <p>Xin chào <strong>${owner.name}</strong>,</p>
        
        <p><strong>${requester.name}</strong> muốn mượn thiết bị sau từ bạn:</p>
        
        <div class="device-info">
          <p><strong>Thiết bị:</strong> ${device.name}</p>
          <p><strong>Người yêu cầu:</strong> ${requester.name} (${requester.phone})</p>
          <p><strong>Thời gian yêu cầu:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        </div>
        
        <p>Vui lòng xác nhận nếu bạn đồng ý cho mượn thiết bị này:</p>
        
        <div class="actions">
          <a href="${confirmUrl}" class="btn btn-accept">Đồng ý</a>
          <a href="${rejectUrl}" class="btn btn-reject">Từ chối</a>
        </div>
        
        <p>Hoặc bạn có thể sử dụng các đường dẫn sau:</p>
        <p>
          <span>Đồng ý cho mượn thiết bị:</span> <a href="${confirmUrl}">${confirmUrl}</a><br>
          <span>Từ chối cho mượn thiết bị</span> <a href="${rejectUrl}">${rejectUrl}</a>
        </p>
        
        <div class="footer">
          <p>Email này được gửi tự động từ hệ thống Kho HTNS. Vui lòng không trả lời email này.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, text, html };
}

/**
 * Generates a notification email for transfer/borrow request result
 * @param {Object} params - Email parameters
 * @param {Object} params.device - Device details
 * @param {Object} params.user - User to notify
 * @param {string} params.action - Action taken (accepted or rejected)
 * @param {string} params.requestType - Type of request (transfer or borrow)
 * @param {Object} params.otherParty - Other party involved in the transfer
 * @param {string} params.baseUrl - Base URL of the application
 * @returns {Object} - Email content object with subject, text and html
 */
export function generateNotificationEmail({ device, user, action, requestType, otherParty, baseUrl }) {
  const deviceUrl = `${baseUrl}/devices/${device.id}`;
  
  let subject, actionText, context;
  
  if (requestType === 'transfer') {
    if (action === 'accepted') {
      subject = `[Kho HTNS] Chuyển thiết bị thành công: ${device.name}`;
      actionText = `${otherParty.name} đã chấp nhận`;
      context = `nhận thiết bị <strong>${device.name}</strong> từ bạn`;
    } else {
      subject = `[Kho HTNS] Yêu cầu chuyển thiết bị bị từ chối: ${device.name}`;
      actionText = `${otherParty.name} đã từ chối`;
      context = `nhận thiết bị <strong>${device.name}</strong> từ bạn`;
    }
  } else { // borrow
    if (action === 'accepted') {
      subject = `[Kho HTNS] Yêu cầu mượn thiết bị được chấp nhận: ${device.name}`;
      actionText = `${otherParty.name} đã chấp nhận`;
      context = `cho bạn mượn thiết bị <strong>${device.name}</strong>`;
    } else {
      subject = `[Kho HTNS] Yêu cầu mượn thiết bị bị từ chối: ${device.name}`;
      actionText = `${otherParty.name} đã từ chối`;
      context = `cho bạn mượn thiết bị <strong>${device.name}</strong>`;
    }
  }
  
  const text = `
    Xin chào ${user.name},

    ${actionText} ${requestType === 'transfer' ? 'nhận' : 'cho mượn'} thiết bị "${device.name}".

    Thiết bị: ${device.name}
    Trạng thái: ${action === 'accepted' ? 'Đã chấp nhận' : 'Đã từ chối'}
    Thời gian: ${new Date().toLocaleString('vi-VN')}

    Xem chi tiết thiết bị: ${deviceUrl}

    Email này được gửi tự động từ hệ thống Kho HTNS.
  `;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .container {
          border: 1px solid #e1e1e1;
          border-radius: 5px;
          padding: 20px;
          margin: 20px auto 0;
          max-width: 600px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 5px;
          border-left: 4px solid ${action === 'accepted' ? '#10b981' : '#ef4444'};
        }
        .device-info {
          background-color: #f0f9ff;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .btn {
          display: inline-block;
          padding: 10px 15px;
          margin-top: 20px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          text-align: center;
          background-color: #4f46e5;
          color: white!important;
        }
        .footer {
          font-size: 12px;
          color: #6b7280;
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
        }
        .status {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 15px;
          font-size: 14px;
          font-weight: bold;
          color: white!important;
          background-color: ${action === 'accepted' ? '#10b981' : '#ef4444'};
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${action === 'accepted' ? 'Yêu cầu đã được chấp nhận' : 'Yêu cầu đã bị từ chối'}</h2>
        </div>
        
        <p>Xin chào <strong>${user.name}</strong>,</p>
        
        <p>${actionText} ${context}.</p>
        
        <div class="device-info">
          <p><strong>Thiết bị:</strong> ${device.name}</p>
          <p><strong>Trạng thái:</strong> <span class="status">${action === 'accepted' ? 'Đã chấp nhận' : 'Đã từ chối'}</span></p>
          <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        </div>
        
        <a href="${deviceUrl}" class="btn">Xem chi tiết thiết bị</a>
        
        <div class="footer">
          <p>Email này được gửi tự động từ hệ thống Kho HTNS. Vui lòng không trả lời email này.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, text, html };
}

export async function sendDeviceTransferRequest({ 
  toUser, 
  fromUser, 
  device, 
  requestId,
  requestType = 'transfer', // 'transfer' hoặc 'request'
  message = ''
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const acceptUrl = `${appUrl}/api/devices/transfer-requests/${requestId}?action=accept`;
  const rejectUrl = `${appUrl}/api/devices/transfer-requests/${requestId}?action=reject`;
  
  const requestTypeText = requestType === 'transfer' 
    ? 'chuyển thiết bị cho bạn' 
    : 'mượn thiết bị từ bạn';

  const subject = `[Kho HTNS] ${fromUser.name} muốn ${requestTypeText}: ${device.name}`;
  
  const text = `
    ${fromUser.name} muốn ${requestTypeText}: ${device.name}
    
    ${message ? `Lời nhắn: ${message}` : ''}
    
    Để xác nhận hoặc từ chối, vui lòng truy cập vào hệ thống.
    
    Xác nhận: ${acceptUrl}
    Từ chối: ${rejectUrl}
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a5568;">Yêu cầu ${requestTypeText}</h2>
      
      <div style="padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin-bottom: 15px;">
          <strong>${fromUser.name}</strong> muốn ${requestTypeText}:
        </p>
        
        <div style="padding: 15px; background-color: #f7fafc; border-radius: 6px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #2d3748;">${device.name}</h3>
          <p style="margin-bottom: 0; color: #718096; font-size: 14px;">ID: ${device.id.substring(0, 8)}</p>
        </div>
        
        ${message ? `
          <div style="padding: 15px; background-color: #f7fafc; border-radius: 6px; margin-bottom: 20px;">
            <h4 style="margin-top: 0; color: #2d3748;">Lời nhắn:</h4>
            <p style="margin-bottom: 0;">${message}</p>
          </div>
        ` : ''}
      </div>
      
      <p style="margin-bottom: 20px;">Vui lòng xác nhận hoặc từ chối yêu cầu:</p>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${acceptUrl}" style="display: inline-block; padding: 10px 20px; margin-right: 10px; background-color: #48bb78; color: white; text-decoration: none; border-radius: 5px;">Xác nhận</a>
        <a href="${rejectUrl}" style="display: inline-block; padding: 10px 20px; background-color: #f56565; color: white; text-decoration: none; border-radius: 5px;">Từ chối</a>
      </div>
      
      <p style="font-size: 12px; color: #718096;">Email này được gửi tự động. Vui lòng không phản hồi.</p>
    </div>
  `;
  
  return sendEmail({
    to: toUser.email,
    subject,
    text,
    html
  });
}

/**
 * Tạo nội dung email thông báo tài khoản mới
 * @param {Object} params - Tham số email
 * @param {Object} params.user - Thông tin người dùng mới
 * @param {string} params.password - Mật khẩu ban đầu (nếu có)
 * @param {string} params.baseUrl - URL cơ sở của ứng dụng
 * @returns {Object} - Đối tượng nội dung email gồm subject, text và html
 */
export function generateNewAccountEmail({ user, password, baseUrl }) {
  const loginUrl = `${baseUrl}/login`;
  
  const subject = `[Kho HTNS] Tài khoản của bạn đã được tạo`;
  
  const text = `
    Xin chào ${user.name},

    Tài khoản của bạn đã được tạo thành công trên hệ thống Kho HTNS.

    Thông tin đăng nhập:
    - Số điện thoại: ${user.phone}
    - Mật khẩu: ${password || '[Mật khẩu đã được thiết lập]'}

    Bạn có thể đăng nhập tại: ${loginUrl}

    Vì lý do bảo mật, khuyến nghị bạn thay đổi mật khẩu ngay sau lần đăng nhập đầu tiên.

    Email này được gửi tự động từ hệ thống Kho HTNS.
  `;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .container {
          border: 1px solid #e1e1e1;
          border-radius: 5px;
          padding: 20px;
          margin: 20px auto 0;
          max-width: 600px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 5px;
          border-left: 4px solid #4f46e5;
        }
        .user-info {
          background-color: #f0f9ff;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .btn {
          display: inline-block;
          padding: 10px 20px;
          margin-top: 20px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          text-align: center;
          background-color: #4f46e5;
          color: white!important;
        }
        .footer {
          font-size: 12px;
          color: #6b7280;
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
        }
        .warning {
          color: #b91c1c;
          font-size: 14px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Tài khoản đã được tạo thành công</h2>
        </div>
        
        <p>Xin chào <strong>${user.name}</strong>,</p>
        
        <p>Tài khoản của bạn đã được tạo thành công trên hệ thống Kho HTNS.</p>
        
        <div class="user-info">
          <h3>Thông tin đăng nhập</h3>
          <p><strong>Số điện thoại:</strong> ${user.phone}</p>
          <p><strong>Mật khẩu:</strong> ${password || '[Mật khẩu đã được thiết lập]'}</p>
        </div>
        
        <p class="warning">Vì lý do bảo mật, khuyến nghị bạn thay đổi mật khẩu ngay sau lần đăng nhập đầu tiên.</p>
        
        <a href="${loginUrl}" class="btn">Đăng nhập ngay</a>
        
        <div class="footer">
          <p>Email này được gửi tự động từ hệ thống Kho HTNS. Vui lòng không trả lời email này.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, text, html };
}

/**
 * Gửi email thông báo tài khoản mới cho người dùng
 * @param {Object} user - Thông tin người dùng mới tạo
 * @param {string} password - Mật khẩu ban đầu (plaintext)
 * @returns {Promise<Object>} - Kết quả gửi email
 */
export async function sendNewAccountEmail(user, password) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const emailContent = generateNewAccountEmail({ user, password, baseUrl });
  
  return sendEmail({
    to: user.email,
    ...emailContent
  });
}