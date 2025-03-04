import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

export default function EventDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // State cho modal xác nhận xóa
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (id) {
      fetchEvent();
    }

    // Lấy thông tin người dùng từ localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        
        // Kiểm tra nếu người dùng có role admin
        setIsAdmin(user.role === 'admin');
      }
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) {
        throw new Error('Không thể tải thông tin sự kiện');
      }
      const data = await response.json();
      setEvent(data);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Xử lý xóa sự kiện
  const handleDeleteEvent = async () => {
    try {
      setIsDeleting(true);
      setDeleteError('');
      
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể xóa sự kiện');
      }
      
      // Điều hướng về trang danh sách sự kiện sau khi xóa thành công
      router.push('/events');
    } catch (err) {
      console.error('Error deleting event:', err);
      setDeleteError(err.message);
      setIsDeleting(false);
    }
  };

  // Các phần hiển thị loading và error không thay đổi
  if (isLoading) {
    return <div className="text-center py-8">Đang tải thông tin...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">{error}</p>
        <Link href="/events" className="btn mt-4">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-8">
        <p>Không tìm thấy sự kiện</p>
        <Link href="/events" className="btn mt-4">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Chi tiết phiếu mượn</h1>
          <p className="text-gray-600 mt-1">
            Phiếu #{id.substring(0, 8)} - Do {event?.creator?.name || 'N/A'} tạo
          </p>
        </div>
        
        <div className="flex space-x-2">
          {/* Nút quay lại */}
          <Link href="/events" className="btn-outline">
            Quay lại
          </Link>
          
          {/* Nút trả thiết bị - hiển thị nếu sự kiện đang diễn ra */}
          {event.status === 'ongoing' && (
            <Link
              href={`/events/${id}/return`}
              className="btn"
            >
              Trả thiết bị
            </Link>
          )}
          
          {/* Nút sửa sự kiện - hiển thị nếu sự kiện đang diễn ra */}
          {event.status === 'ongoing' && (
            <Link
              href={`/events/${id}/edit`}
              className="btn-secondary"
            >
              Sửa
            </Link>
          )}
          
          {/* Nút xóa sự kiện - chỉ hiển thị nếu người dùng có quyền admin */}
          {isAdmin && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn-danger"
            >
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* Phần content chính của trang - giữ nguyên */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{event.title}</h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              event.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {event.status === 'completed' ? 'Đã hoàn trả ' + event.eventDevices.length  + ' thiết bị' : 'Sự kiện vẫn đang diễn ra'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Ngày tổ chức</p>
              <p>{new Date(event.createdDate).toLocaleString()}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Người mượn</p>
              <p>{event.creator?.name || 'N/A'} ({event.creator?.phone || 'N/A'})</p>
            </div>
            
            {/* Thêm phần hiển thị người sửa nếu có */}
            {event.updater !== null && event.status !== 'completed' ? (
              <div>
                <p className="text-sm text-gray-500">Người cập nhật gần nhất</p>
                <p>{event.updater.name || ''} ({event.updater.phone})</p>
              </div>
            ) : event.updater !== null ? (
              <div>
                <p className="text-sm text-gray-500">Người trả thiết bị</p>
                <p>{event.updater.name || ''} ({event.updater.phone || 'N/A'})</p>
              </div>
            ) : ( 
              <div>
                <p className="text-sm text-gray-500">Người trả thiết bị</p>
                <p>N/A</p>
              </div>
            )}
            
            {event.status === 'completed' && (
              <>
                <div>
                  <p className="text-sm text-gray-500">Ngày trả</p>
                  <p>{event.returnedDate ? new Date(event.returnedDate).toLocaleString() : 'N/A'}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">Danh sách thiết bị</h3>
          <p className="text-sm text-gray-500 mt-1">
            {event.eventDevices.length} Thiết bị
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {event.eventDevices.map(eventDevice => (
            <div key={eventDevice.id} className="p-6 flex">
              <div className="w-16 h-16 flex-shrink-0 relative rounded-md overflow-hidden">
                {eventDevice.device.image ? (
                  <Image 
                    src={eventDevice.device.image}
                    alt={eventDevice.device.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="bg-gray-100 w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No image</span>
                  </div>
                )}
              </div>
              
              <div className="ml-4 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-medium">
                      <Link href={`/devices/${eventDevice.device.id}`} className="hover:text-blue-600">
                        {eventDevice.device.name}
                      </Link>
                    </h4>
                    
                    <p className="text-sm text-gray-500 mt-1">
                      Status: <span className={`font-medium ${eventDevice.device.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                        {eventDevice.device.status}
                      </span>
                      {event.status === 'completed' && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
                           Đã hoàn trả sau sự kiện
                        </span>
                      )}
                    </p>
                    
                    {eventDevice.device.borrower && (
                      <p className="text-sm text-gray-500 mt-1">
                        Currently borrowed by: {eventDevice.device.borrower.name}
                      </p>
                    )}
                  </div>
                  
                  {event.status === 'completed' && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      eventDevice.condition === 'damaged' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {eventDevice.condition || 'normal'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Modal xác nhận xóa sự kiện */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Xác nhận xóa</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-500"
                disabled={isDeleting}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
                <p>{deleteError}</p>
              </div>
            )}
            
            <div className="mb-4">
              <p className="text-gray-700">
                Bạn có chắc chắn muốn xóa sự kiện <span className="font-bold">{event.title}</span>?
              </p>
              
              <p className="mt-2 text-gray-600">
                Hành động này không thể hoàn tác. Chỉ người quản trị mới có quyền xóa sự kiện.
              </p>
              
              {event.status === 'ongoing' && (
                <p className="mt-2 text-yellow-600 bg-yellow-50 p-3 rounded text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Sự kiện đang diễn ra và có {event.eventDevices.length} thiết bị đang được mượn. Tất cả thiết bị sẽ được trả về kho.
                </p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-outline"
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteEvent}
                className="btn-danger flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Xác nhận xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}