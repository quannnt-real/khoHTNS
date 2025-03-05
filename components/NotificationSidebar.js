import { useState } from 'react';
import { useNotifications } from './NotificationProvider';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function NotificationSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, handleNotificationAction } = useNotifications();
  const router = useRouter();
  
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
  
  const handleClick = (notification) => {
    const metadata = typeof notification.metadata === 'string' 
      ? JSON.parse(notification.metadata || '{}') 
      : notification.metadata;
      
    // Nếu là thông báo yêu cầu, không đánh dấu đã đọc và mở modal
    if ((notification.type === 'transfer_request' || notification.type === 'borrow_request') && !notification.read) {
      // Modal sẽ hiển thị thông qua provider
      return;
    }
    
    // Đánh dấu đã đọc và điều hướng nếu có deviceId
    markAsRead(notification.id);
    if (metadata && metadata.deviceId) {
      router.push(`/devices/${metadata.deviceId}`);
    }
    
    // Đóng sidebar
    setIsOpen(false);
  };
  
  return (
    <>
      {/* Nút mở sidebar */}
      <button 
        className="fixed right-4 bottom-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-40 flex items-center justify-center"
        onClick={() => setIsOpen(true)}
      >
        <FontAwesomeIcon icon="bell" className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      {/* Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="bg-black bg-opacity-50 flex-grow" onClick={() => setIsOpen(false)}></div>
          <div className="bg-white w-full max-w-md shadow-lg flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Thông báo</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                <FontAwesomeIcon icon="times" className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Không có thông báo nào
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map(notification => {
                    // Parse metadata if it's a string
                    const metadata = typeof notification.metadata === 'string' 
                      ? JSON.parse(notification.metadata || '{}') 
                      : notification.metadata;
                      
                    return (
                      <div 
                        key={notification.id} 
                        className={`p-4 hover:bg-gray-50 ${notification.read ? 'opacity-75' : 'bg-blue-50'}`}
                        onClick={() => handleClick(notification)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          <span className="text-xs text-gray-500">{formatDate(notification.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">{notification.message}</p>
                        
                        {/* Nút xác nhận/từ chối cho thông báo yêu cầu chưa đọc */}
                        {(notification.type === 'transfer_request' || notification.type === 'borrow_request') && !notification.read && (
                          <div className="mt-3 flex justify-end space-x-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationAction(notification.id, 'reject');
                              }}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Từ chối
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationAction(notification.id, 'accept');
                              }}
                              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Xác nhận
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}