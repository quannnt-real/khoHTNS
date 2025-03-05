import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNotifications } from '../components/NotificationProvider';
import ProtectedRoute from '../lib/ProtectedRoute';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;
  
  // Notification context (for real-time updates)
  const { markAsRead, handleNotificationAction } = useNotifications();
  
  const router = useRouter();
  
  useEffect(() => {
    // Get current user from localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        setIsAdmin(user.role === 'admin');
      }
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
    }
    
    fetchNotifications();
  }, [page]);
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch(`/api/notifications?page=${page}&pageSize=${PAGE_SIZE}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications);
      setTotalPages(Math.ceil(data.total / PAGE_SIZE) || 1);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Không thể tải thông báo. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const handleDeleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  
  const handleDeleteAllNotifications = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa tất cả thông báo không?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/notifications/delete-all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete all notifications');
      }
      
      // Update local state
      setNotifications([]);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };
  
  // Removed admin function to delete user's notifications
  
  return (
    <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Quản lý thông báo</h1>
            <div className="flex space-x-3">
              <button 
                onClick={handleMarkAllAsRead}
                className="btn-outline"
              >
                <FontAwesomeIcon icon="envelope-open" className="mr-2" />
                Đánh dấu tất cả đã đọc
              </button>
              <button 
                onClick={handleDeleteAllNotifications}
                className="btn-danger"
              >
                <FontAwesomeIcon icon="trash" className="mr-2" />
                Xóa tất cả
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Đang tải thông báo...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FontAwesomeIcon icon="bell-slash" className="text-gray-400 text-4xl mb-3" />
              <p className="text-gray-500">Bạn không có thông báo nào</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y">
                {notifications.map(notification => {
                  // Parse metadata
                  const metadata = typeof notification.metadata === 'string' 
                    ? JSON.parse(notification.metadata || '{}') 
                    : notification.metadata;
                  
                  return (
                    <div 
                      key={notification.id} 
                      className={`p-4 hover:bg-gray-50 flex ${notification.read ? 'opacity-75' : 'bg-blue-50'}`}
                    >
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <h4 className="font-medium text-gray-900">{notification.title}</h4>
                            {!notification.read && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-xs text-blue-800 rounded-full">
                                Mới
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(notification.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">{notification.message}</p>
                        
                        {/* Thông tin về trạng thái của thông báo chuyển thiết bị */}
                        {(notification.type === 'transfer_request' || notification.type === 'borrow_request') && (
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              notification.transferStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                              notification.transferStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                              notification.read ? 'bg-gray-100 text-gray-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {notification.transferStatus === 'accepted' ? 'Đã chấp nhận' :
                               notification.transferStatus === 'rejected' ? 'Đã từ chối' :
                               notification.read ? 'Đã xử lý' : 'Đang chờ xử lý'}
                            </span>
                            
                            {metadata && metadata.deviceId && (
                              <button 
                                onClick={() => router.push(`/devices/${metadata.deviceId}`)}
                                className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
                              >
                                Xem thiết bị
                              </button>
                            )}
                          </div>
                        )}
                        
                        {/* Nút xác nhận/từ chối cho thông báo yêu cầu chưa đọc */}
                        {(notification.type === 'transfer_request' || notification.type === 'borrow_request') && 
                          !notification.read && 
                          !notification.transferStatus && (
                          <div className="mt-3 flex space-x-2">
                            <button 
                              onClick={() => handleNotificationAction(notification.id, 'reject')}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Từ chối
                            </button>
                            <button 
                              onClick={() => handleNotificationAction(notification.id, 'accept')}
                              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Xác nhận
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-start space-x-2 ml-4">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Đánh dấu đã đọc"
                          >
                            <FontAwesomeIcon icon="envelope-open" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Xóa thông báo"
                        >
                          <FontAwesomeIcon icon="trash" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <nav className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className={`px-3 py-1 rounded ${page === 1 ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                >
                  <FontAwesomeIcon icon="chevron-left" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded ${page === p ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  >
                    {p}
                  </button>
                ))}
                
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className={`px-3 py-1 rounded ${page === totalPages ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                >
                  <FontAwesomeIcon icon="chevron-right" />
                </button>
              </nav>
            </div>
          )}
          
          {/* Remove Admin section for deleting user notifications */}
        </div>
    </ProtectedRoute>
  );
}