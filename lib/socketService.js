const { Server } = require('socket.io');

let io;

/**
 * Khởi tạo Socket.IO server
 * @param {Object} server - HTTP Server instance
 * @returns {Object} - Socket.IO instance
 */
function initSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    
    // Xác thực người dùng
    socket.on('authenticate', (userId) => {
      if (!userId) return;
      
      // Lưu userId vào socket để biết người dùng nào đang kết nối
      socket.userId = userId;
      socket.join(`user:${userId}`);
      console.log(`User ${userId} connected on socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}, User: ${socket.userId || 'unknown'}`);
    });
  });

  return io;
}

/**
 * Gửi thông báo đến người dùng cụ thể
 * @param {string} userId - ID của người dùng nhận thông báo
 * @param {Object} notification - Thông báo cần gửi
 */
function sendNotificationToUser(userId, notification) {
  if (io) {
    console.log(`Sending notification to user ${userId}:`, notification);
    io.to(`user:${userId}`).emit('notification', notification);
  } else {
    console.warn('Socket.IO server not initialized yet. Notification not sent.');
  }
}

/**
 * Lấy Socket.IO instance đã được khởi tạo
 * @returns {Object|null} Socket.IO instance hoặc null nếu chưa khởi tạo
 */
function getIO() {
  return io;
}

module.exports = {
  initSocketServer,
  sendNotificationToUser,
  getIO
};