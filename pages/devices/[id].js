import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';

export default function DeviceDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [device, setDevice] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Borrow/Return state
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [transferUserId, setTransferUserId] = useState('');
  const [returnLocationImage, setReturnLocationImage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  
  useEffect(() => {
    // Add logging
    // console.log("Device ID from router:", id);
    
    if (id) {
      // console.log("Starting to fetch device and users data");
      fetchDevice();
      fetchUsers();
    } else {
      // console.log("No device ID available yet");
    }
  }, [id]);
  
  const fetchDevice = async () => {
    try {
      // console.log("Fetching device with ID:", id);
      const response = await fetch(`/api/devices/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể tải thông tin thiết bị');
      }
      
      const data = await response.json();
      // console.log("Device data received:", data);
      setDevice(data);
    } catch (err) {
      console.error('Error fetching device:', err);
      setError(err.message || 'Không thể tải thông tin thiết bị. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };
  
  const handleDeleteDevice = async () => {
    if (!confirm('Are you sure you want to delete this equipment?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/devices/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete device');
      }
      
      router.push('/');
    } catch (err) {
      console.error('Error deleting device:', err);
      setError('Failed to delete device. Please try again.');
    }
  };
  
  const handleBorrow = async () => {
    setActionLoading(true);
    setActionError('');
    
    try {
      let user;
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) throw new Error('Vui lòng đăng nhập để mượn thiết bị');
        user = JSON.parse(userStr);
      } catch (err) {
        throw new Error('Vui lòng đăng nhập để mượn thiết bị');
      }

      const response = await fetch('/api/borrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceIds: [id],
          userId: user.id
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi mượn thiết bị');
      }

      // Refresh và hiển thị thông báo thành công
      await fetchDevice();
      setActionError('');
      alert('Mượn thiết bị thành công!');
      
    } catch (err) {
      console.error('Error borrowing device:', err);
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleReturn = async () => {
    setActionLoading(true);
    setActionError('');
    
    try {
      // Lấy thông tin user từ localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('Vui lòng đăng nhập để trả thiết bị');
      }
      const user = JSON.parse(userStr);

      const response = await fetch('/api/borrow', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: id,
          userId: user.id,  // Thêm userId vào request
          locationImage: returnLocationImage
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi trả thiết bị');
      }
      
      setShowReturnModal(false);
      fetchDevice(); // Refresh device data
      alert('Trả thiết bị thành công!');
    } catch (err) {
      console.error('Error returning device:', err);
      setActionError(err.message || 'Lỗi khi trả thiết bị. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleTransfer = async () => {
    if (!transferUserId) {
      setActionError('Please select a user');
      return;
    }
    
    setActionLoading(true);
    setActionError('');
    
    try {
      const response = await fetch('/api/borrow/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: id,
          fromUserId: device.borrowerId,
          toUserId: transferUserId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to transfer device');
      }
      
      setShowTransferModal(false);
      fetchDevice(); // Refresh device data
    } catch (err) {
      console.error('Error transferring device:', err);
      setActionError(err.message || 'Failed to transfer device. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      setReturnLocationImage(data.imagePath);
    } catch (err) {
      console.error('Error uploading image:', err);
      setActionError('Failed to upload image. Please try again.');
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>Loading device details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">{error}</p>
        <Link href="/" className="btn mt-4 inline-block">
          Trở lại danh sách thiết bị
        </Link>
      </div>
    );
  }
  
  if (!device) {
    return (
      <div className="text-center py-8">
        <p>Không tìm thấy thiết bị nào</p>
        <Link href="/" className="btn mt-4 inline-block">
        Trở lại danh sách thiết bị
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{device.name}</h1>
        <div className="flex space-x-2">
          <Link href={`/devices/edit/${id}`} className="btn-secondary">
            Edit
          </Link>
          <button onClick={handleDeleteDevice} className="btn-danger">
            Delete
          </button>
          <Link href="/" className="btn inline-block">
            Quay lại
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="md:flex">
          <div className="md:w-1/3 relative h-64 md:h-auto">
            {device.image ? (
              <Image 
                src={device.image}
                alt={device.name}
                className="object-cover h-full w-full"
                width={400}
                height={300}
                unoptimized={true}
              />
            ) : (
              <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400">No image available</p>
              </div>
            )}
          </div>
          
          <div className="p-6 md:w-2/3">
            <div className="flex justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{device.name}</h2>
                <div className="flex flex-wrap mt-2 gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    device.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {device.status === 'available' ? 'Có Sẵn' : 'Đang Mượn'}
                  </span>
                  
                  {device.borrowHistory && device.borrowHistory.length > 0 && device.borrowHistory[0].returnDate && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      Đã Trả
                    </span>
                  )}
                  
                  {device.borrowHistory && device.borrowHistory.length > 0 && device.borrowHistory[0].transferTo && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                      Đã Chuyển
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                {device.status === 'available' ? (
                  <button onClick={handleBorrow} className="btn">
                    Mượn
                  </button>
                ) : (
                  <>
                    <button onClick={() => setShowReturnModal(true)} className="btn">
                      Trả
                    </button>
                    <button onClick={() => setShowTransferModal(true)} className="btn-secondary">
                      Chuyển
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {device.borrower && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
                <div className="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-md font-semibold text-gray-900">Thông tin phiếu mượn</h3>
                </div>
                
                <div className="pl-7 grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Người mượn:</p>
                    <p className="text-sm text-gray-800">{device.borrower.name} ({device.borrower.phone})</p>
                  </div>
                  
                  {device.borrowHistory && device.borrowHistory.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Thời gian mượn:</p>
                      <p className="text-sm text-gray-800">
                        {new Date(device.borrowHistory[0].borrowDate).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                  
                  {device.borrowHistory && device.borrowHistory.length > 0 && device.borrowHistory[0].returnDate && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Thời gian trả:</p>
                      <p className="text-sm text-gray-800">
                        {new Date(device.borrowHistory[0].returnDate).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                  
                  {device.borrowHistory && device.borrowHistory.length > 0 && device.borrowHistory[0].transferTo && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Đã chuyển cho:</p>
                      <p className="text-sm text-gray-800">
                        {device.borrowHistory[0].transferTo.name} ({device.borrowHistory[0].transferTo.phone})
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {device.purchaseDate && (
                <div>
                  <p className="text-sm text-gray-500">Ngày mua</p>
                  <p>{device.purchaseDate}</p>
                </div>
              )}
              
              {device.warrantyEnd && (
                <div>
                  <p className="text-sm text-gray-500">Thời hạn Bảo Hành</p>
                  <p>{device.warrantyEnd}</p>
                </div>
              )}
              
              {device.warrantyPlace && (
                <div>
                  <p className="text-sm text-gray-500">Địa chỉ mua/bảo hành</p>
                  <p>{device.warrantyPlace}</p>
                </div>
              )}
            </div>
            
            {device.locationImage && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">Vị trí cất</p>
                <div className="relative h-40 w-full md:w-1/2 overflow-hidden rounded-md">
                  <Image 
                    src={device.locationImage}
                    alt="Storage location"
                    className="object-cover"
                    fill
                    unoptimized={true}
                  />
                </div>
              </div>
            )}
            
            {device.notes && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-1">Ghi chú</p>
                <p className="text-gray-700">{device.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {device.borrowHistory && device.borrowHistory.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Lịch sử mượn trả</h2>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người mượn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày mượn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày trả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ghi chú
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {device.borrowHistory.map((history) => (
                    <tr key={history.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{history.user.name}</div>
                        <div className="text-sm text-gray-500">{history.user.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(history.borrowDate).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {history.returnDate ? 
                          new Date(history.returnDate).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {history.returnDate ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            Đã trả
                          </span>
                        ) : history.transferTo ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                            Đã chuyển
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            Đang mượn
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {history.transferTo ? (
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8z" />
                              <path d="M12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                            </svg>
                            <span>Chuyển cho {history.transferTo.name}</span>
                          </div>
                        ) : history.returnDate ? (
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Trả đúng hạn</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Error */}
      {actionError && (
        <div className="fixed top-4 right-4 bg-red-50 border-l-4 border-red-400 p-4 rounded shadow-md z-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{actionError}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium">Xác nhận trả thiết bị</h3>
              </div>
              <button 
                onClick={() => setShowReturnModal(false)} 
                className="text-gray-400 hover:text-gray-500"
                disabled={actionLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">
                <div className="flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{actionError}</span>
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-700 font-medium">Thông tin thiết bị đang trả</span>
              </div>
              
              <div className="ml-7 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Tên thiết bị:</p>
                  <p className="text-sm text-gray-800">{device.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 font-medium">Người mượn:</p>
                  <p className="text-sm text-gray-800">{device.borrower?.name}</p>
                </div>
                
                {device.borrowHistory && device.borrowHistory.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Thời gian mượn:</p>
                    <p className="text-sm text-gray-800">
                      {new Date(device.borrowHistory[0].borrowDate).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600 font-medium">Thời gian trả:</p>
                  <p className="text-sm text-gray-800">
                    {new Date().toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh vị trí cất
                <span className="ml-1 text-red-500">*</span>
              </label>
              <div className="mt-1 border-2 border-dashed border-gray-300 rounded-md p-4">
                {returnLocationImage ? (
                  <div className="mb-2 relative h-52 w-full overflow-hidden rounded-md">
                    <Image 
                      src={returnLocationImage}
                      alt="Vị trí cất thiết bị"
                      className="object-cover"
                      fill
                      unoptimized={true}
                    />
                  </div>
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">Vui lòng chụp ảnh vị trí cất thiết bị</p>
                  </div>
                )}
                
                <div className="mt-3 flex justify-center">
                  <label className="btn inline-block cursor-pointer">
                    {returnLocationImage ? 'Thay đổi ảnh' : 'Chọn ảnh'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={actionLoading}
                    />
                  </label>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Vui lòng chụp ảnh rõ ràng vị trí cất thiết bị để dễ dàng tìm kiếm sau này
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowReturnModal(true)} 
                className="btn-outline"
                disabled={actionLoading}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleReturn} 
                className={`btn flex items-center ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Xác nhận trả thiết bị
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <h3 className="text-lg font-medium">Chuyển thiết bị cho người khác</h3>
              </div>
              <button 
                onClick={() => setShowTransferModal(false)} 
                className="text-gray-400 hover:text-gray-500"
                disabled={actionLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">
                <div className="flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{actionError}</span>
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-700 font-medium">Thông tin thiết bị đang chuyển</span>
              </div>
              
              <div className="ml-7 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Tên thiết bị:</p>
                  <p className="text-sm text-gray-800">{device.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 font-medium">Người đang mượn:</p>
                  <p className="text-sm text-gray-800">{device.borrower?.name} ({device.borrower?.phone})</p>
                </div>
                
                {device.borrowHistory && device.borrowHistory.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Thời gian mượn:</p>
                    <p className="text-sm text-gray-800">
                      {new Date(device.borrowHistory[0].borrowDate).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600 font-medium">Thời gian chuyển:</p>
                  <p className="text-sm text-gray-800">
                    {new Date().toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="transferUserId" className="block text-sm font-medium text-gray-700 mb-2">
                Chọn người nhận
                <span className="ml-1 text-red-500">*</span>
              </label>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <select
                  id="transferUserId"
                  value={transferUserId}
                  onChange={(e) => setTransferUserId(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="">-- Chọn người nhận --</option>
                  {users
                    .filter(user => user.id !== device.borrowerId)
                    .map(user => (
                      <option key={user.id} value={user.id}>{user.name} ({user.phone})</option>
                    ))
                  }
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <p className="mt-2 text-xs text-gray-500">
                Sau khi chuyển, người nhận sẽ chịu trách nhiệm với thiết bị này
              </p>
            </div>
            
            <div className="mt-2 p-3 bg-yellow-50 rounded-md text-sm text-yellow-700">
              <div className="flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>
                  Thao tác này sẽ chuyển trách nhiệm thiết bị từ <strong>{device.borrower?.name}</strong> sang người được chọn.
                  Lịch sử mượn trả sẽ được ghi nhận.
                </span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowTransferModal(false)} 
                className="btn-outline"
                disabled={actionLoading}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleTransfer} 
                className={`btn flex items-center ${!transferUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={actionLoading || !transferUserId}
              >
                {actionLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8z" />
                      <path d="M12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                    </svg>
                    Xác nhận chuyển thiết bị
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