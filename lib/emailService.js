// Email service for sending notifications
// This is a placeholder implementation that logs emails to the console
// In a production environment, you would integrate with an email service like SendGrid, Mailgun, etc.

/**
 * Sends an email with the provided parameters
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.text - Plain text version of the email
 * @param {string} params.html - HTML version of the email
 * @returns {Promise<boolean>} - Success status
 */
export async function sendEmail({ to, subject, text, html }) {
  // In development, just log the email to the console
  console.log('====== EMAIL NOTIFICATION ======');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('Text content:');
  console.log(text);
  console.log('HTML content:');
  console.log(html);
  console.log('==============================');

  // In production, you would use an email service like this:
  // 
  // const response = await fetch('https://api.emailprovider.com/v3/mail/send', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`
  //   },
  //   body: JSON.stringify({
  //     personalizations: [{ to: [{ email: to }] }],
  //     subject,
  //     content: [
  //       { type: 'text/plain', value: text },
  //       { type: 'text/html', value: html }
  //     ],
  //     from: { email: 'notifications@yourapp.com', name: 'Kho HTNS' }
  //   })
  // });
  // 
  // return response.ok;

  // For now, always return success
  return true;
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
          margin-top: 20px;
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
          color: white;
        }
        .btn-reject {
          background-color: #ef4444;
          color: white;
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
          <a href="${confirmUrl}">Xác nhận nhận thiết bị</a><br>
          <a href="${rejectUrl}">Từ chối nhận thiết bị</a>
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
          margin-top: 20px;
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
          color: white;
        }
        .btn-reject {
          background-color: #ef4444;
          color: white;
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
          <a href="${confirmUrl}">Đồng ý cho mượn thiết bị</a><br>
          <a href="${rejectUrl}">Từ chối cho mượn thiết bị</a>
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
          margin-top: 20px;
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
          color: white;
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
          color: white;
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