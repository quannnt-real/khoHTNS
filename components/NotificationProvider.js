import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/router';

// Create context for notifications
const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const router = useRouter();

  // Lấy thông báo từ API khi component mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter(n => !n.read).length);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  // Thiết lập Socket.IO khi component mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const user = JSON.parse(userStr);
    const socketInstance = io();
    
    socketInstance.on('connect', () => {
      console.log('Socket connected');
      socketInstance.emit('authenticate', user.id);
    });

    socketInstance.on('notification', (notification) => {
      console.log('Received notification:', notification);
      
      // Thêm thông báo mới vào state
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Hiển thị modal với thông báo mới
      setCurrentNotification(notification);
      setShowModal(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  // Xử lý xác nhận hoặc từ chối thông báo
  const handleNotificationAction = async (notificationId, action) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;
      
      const metadata = typeof notification.metadata === 'string' 
        ? JSON.parse(notification.metadata || '{}') 
        : notification.metadata;
      
      // Gọi API xác nhận/từ chối
      const response = await fetch('/api/transfers/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: metadata.requestId,
          action: action
        }),
      });

      if (response.ok) {
        // Cập nhật thông báo đã đọc
        await markAsRead(notificationId);
        
        // Đóng modal
        setShowModal(false);
        
        // Nếu là xác nhận từ modal, chuyển hướng đến trang chi tiết thiết bị
        if (action === 'accept' && metadata.deviceId) {
          router.push(`/devices/${metadata.deviceId}`);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Có lỗi xảy ra khi xử lý yêu cầu');
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
      alert('Có lỗi xảy ra khi xử lý yêu cầu');
    }
  };

  // Đánh dấu thông báo đã đọc
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Cập nhật state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? {...n, read: true} : n)
      );
      setUnreadCount(prev => Math.max(prev - 1, 0));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead,
      handleNotificationAction 
    }}>
      {children}
      
      {/* Modal thông báo */}
      {showModal && currentNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{currentNotification.title}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <p className="mb-6">{currentNotification.message}</p>
            
            {(currentNotification.type === 'transfer_request' || currentNotification.type === 'borrow_request') ? (
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => handleNotificationAction(currentNotification.id, 'reject')}
                  className="btn-outline"
                >
                  Từ chối
                </button>
                <button 
                  onClick={() => handleNotificationAction(currentNotification.id, 'accept')}
                  className="btn"
                >
                  Xác nhận
                </button>
              </div>
            ) : (
              <div className="flex justify-end">
                <button 
                  onClick={() => {
                    markAsRead(currentNotification.id);
                    setShowModal(false);
                  }}
                  className="btn"
                >
                  Đã hiểu
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);