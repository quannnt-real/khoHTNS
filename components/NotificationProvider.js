import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/router';
import { debounce, SimpleCache } from '../lib/utils';

// Create context for notifications
const NotificationContext = createContext();

// Create cache instance for notifications
const notificationCache = new SimpleCache(30000); // 30 seconds TTL

export function NotificationProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const router = useRouter();

  // Debounced version of fetchNotifications to prevent excessive API calls
  const debouncedFetchNotifications = useCallback(
    debounce(async () => {
      // Check cache first
      const cached = notificationCache.get('notifications');
      if (cached) {
        setNotifications(cached.notifications);
        setUnreadCount(cached.unreadCount);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('/api/notifications?limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Sắp xếp thông báo theo thời gian gần nhất
          const sortedNotifications = data.notifications.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          
          const unreadCount = sortedNotifications.filter(n => !n.read).length;
          
          // Cache the result
          notificationCache.set('notifications', {
            notifications: sortedNotifications,
            unreadCount
          });
          
          setNotifications(sortedNotifications);
          setUnreadCount(unreadCount);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    }, 1000), // Debounce for 1 second
    []
  );

  // Lấy thông báo từ API khi component mount (một lần duy nhất)
  useEffect(() => {
    // Chỉ fetch một lần khi mount, Socket.IO sẽ xử lý real-time updates
    debouncedFetchNotifications();
  }, [debouncedFetchNotifications]);

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
      
      // Clear cache when new notification arrives
      notificationCache.clear();
      
      // Kiểm tra trùng lặp thông báo trước khi thêm
      setNotifications(prev => {
        // Kiểm tra xem thông báo đã tồn tại chưa
        const exists = prev.some(n => n.id === notification.id);
        if (exists) return prev;
        
        // Lấy metadata của thông báo mới
        const metadata = typeof notification.metadata === 'string' 
          ? JSON.parse(notification.metadata || '{}') 
          : notification.metadata;
        
        let updatedNotifications = [...prev];
        
        // Nếu là thông báo xác nhận (accepted/rejected), cập nhật hoặc loại bỏ các thông báo liên quan
        if (notification.type === 'confirmation' && metadata && metadata.requestId) {
          // Đánh dấu tất cả thông báo liên quan đến cùng một requestId là đã đọc
          updatedNotifications = updatedNotifications.map(n => {
            const nMetadata = typeof n.metadata === 'string'
              ? JSON.parse(n.metadata || '{}')
              : n.metadata;
              
            if (nMetadata && nMetadata.requestId === metadata.requestId) {
              return { 
                ...n, 
                read: true, 
                transferStatus: metadata.transferStatus || (metadata.action === 'accept' ? 'accepted' : 'rejected') 
              };
            }
            return n;
          });
          
          // Thêm thông báo mới vào danh sách
          return [notification, ...updatedNotifications];
        }
        
        // Đối với các thông báo thông thường, thêm vào đầu danh sách
        return [notification, ...prev];
      });
      
      // Cập nhật số lượng thông báo chưa đọc
      setUnreadCount(prev => {
        const unreadNotifsCount = notifications.filter(n => !n.read).length + 1;
        return unreadNotifsCount;
      });
      
      // Hiển thị modal với thông báo mới nếu không phải là thông báo xác nhận từ chối
      const metadata = typeof notification.metadata === 'string' 
        ? JSON.parse(notification.metadata || '{}') 
        : notification.metadata;
        
      const shouldShowModal = !(notification.type === 'confirmation' && metadata && metadata.action === 'reject');
      
      if (shouldShowModal) {
        setCurrentNotification(notification);
        setShowModal(true);
      }
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
      // Tìm thông báo và kiểm tra
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;
      
      // Kiểm tra nếu thông báo đã được đọc (xử lý) rồi thì bỏ qua
      if (notification.read) {
        alert('Thông báo này đã được xử lý');
        return;
      }
      
      // Tạm thời đánh dấu là đang xử lý để tránh xử lý đồng thời
      // Cập nhật UI ngay lập tức để vô hiệu hóa các nút thao tác
      setNotifications(prev => prev.map(n => {
        if (n.id === notificationId) {
          return { ...n, processing: true };
        }
        return n;
      }));
      
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
        
        // Cập nhật tất cả các thông báo liên quan để hiển thị đúng trạng thái
        setNotifications(prev => prev.map(n => {
          const nMetadata = typeof n.metadata === 'string'
            ? JSON.parse(n.metadata || '{}')
            : n.metadata;
            
          // Đánh dấu tất cả thông báo có cùng requestId là đã đọc
          if (nMetadata && metadata && nMetadata.requestId === metadata.requestId) {
            return { ...n, read: true, processing: false, action: action };
          }
          return n;
        }));
        
        // Đóng modal
        setShowModal(false);
        
        // Thông báo thành công
        alert(`Đã ${action === 'accept' ? 'chấp nhận' : 'từ chối'} yêu cầu thành công`);
        
        // Nếu là xác nhận, chuyển hướng đến trang chi tiết thiết bị
        if (action === 'accept' && metadata.deviceId) {
          router.push(`/devices/${metadata.deviceId}`);
        }
      } else {
        // Xử lý lỗi và khôi phục trạng thái
        setNotifications(prev => prev.map(n => {
          if (n.id === notificationId) {
            return { ...n, processing: false };
          }
          return n;
        }));
        
        const errorData = await response.json();
        alert(errorData.message || 'Có lỗi xảy ra khi xử lý yêu cầu');
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
      
      // Khôi phục trạng thái nếu có lỗi
      setNotifications(prev => prev.map(n => {
        if (n.id === notificationId) {
          return { ...n, processing: false };
        }
        return n;
      }));
      
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
                {currentNotification.processing ? (
                  <span className="text-gray-500">Đang xử lý...</span>
                ) : currentNotification.action || currentNotification.transferStatus ? (
                  <div className="flex space-x-3">
                    <span className="text-gray-500 self-center">
                      Đã {(currentNotification.action === 'accept' || currentNotification.transferStatus === 'accepted') ? 'chấp nhận' : 'từ chối'}
                    </span>
                    <button 
                      onClick={() => {
                        setShowModal(false);
                      }}
                      className="btn"
                    >
                      Đóng
                    </button>
                  </div>
                ) : currentNotification.read ? (
                  <div className="flex space-x-3">
                    <span className="text-gray-500 self-center">Đã xử lý</span>
                    <button 
                      onClick={() => {
                        setShowModal(false);
                      }}
                      className="btn"
                    >
                      Đóng
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => handleNotificationAction(currentNotification.id, 'reject')}
                      className="btn-outline disabled:opacity-50"
                      disabled={currentNotification.processing || currentNotification.read}
                    >
                      Từ chối
                    </button>
                    <button 
                      onClick={() => handleNotificationAction(currentNotification.id, 'accept')}
                      className="btn disabled:opacity-50"
                      disabled={currentNotification.processing || currentNotification.read}
                    >
                      Xác nhận
                    </button>
                  </>
                )}
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