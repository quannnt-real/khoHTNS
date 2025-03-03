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
          <Link href="/" className="btn mt-4 inline-block">
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
                <p className="mt-1 text-gray-600">
                  Trạng thái: <span className={`font-medium ${device.status === 'available' ? 'text-blue-600' : 'text-red-600'}`}>
                    {device.status === 'available' ? 'Có Sẵn' : 'Đang Mượn'}
                  </span>
                </p>
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
              <div className="mb-4 p-3 bg-blue-100 rounded-md">
                <p className="text-blue-700">
                  <span className="font-medium">Người mượn:</span> {device.borrower.name} ({device.borrower.phone})
                </p>
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
          <h2 className="text-xl font-bold mb-4">Lịch sử mượn</h2>
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
                      Đã chuyển cho
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
                        {new Date(history.borrowDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {history.returnDate ? new Date(history.returnDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {history.transferTo ? history.transferTo.name : '—'}
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
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">Trả thiết bị {device.name}</h3>
            
            {actionError && (
              <div className="mb-4 p-2 bg-red-50 text-red-700 rounded-md text-sm">
                {actionError}
              </div>
            )}
            
            <div className="mb-4">
              <label className="form-label">Ảnh vị trí cất</label>
              <div className="mt-1">
                {returnLocationImage ? (
                  <div className="mb-2 relative h-40 w-full overflow-hidden rounded-md">
                    <Image 
                      src={returnLocationImage}
                      alt="Vị trí cất mới"
                      className="object-cover"
                      fill
                      unoptimized={true}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-2">Chưa chọn ảnh</p>
                )}
                
                <label className="btn-secondary inline-block cursor-pointer">
                  Chọn ảnh
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
            
            <div className="flex justify-end space-x-2 mt-6">
              <button 
                onClick={() => setShowReturnModal(false)} 
                className="btn-secondary"
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button 
                onClick={handleReturn} 
                className="btn"
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận trả'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">Transfer {device.name}</h3>
            
            {actionError && (
              <div className="mb-4 p-2 bg-red-50 text-red-700 rounded-md text-sm">
                {actionError}
              </div>
            )}
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Currently borrowed by: <span className="font-medium">{device.borrower?.name}</span>
              </p>
              
              <label htmlFor="transferUserId" className="form-label">Transfer To</label>
              <select
                id="transferUserId"
                value={transferUserId}
                onChange={(e) => setTransferUserId(e.target.value)}
                className="form-input"
                required
              >
                <option value="">Select a user</option>
                {users
                  .filter(user => user.id !== device.borrowerId)
                  .map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.phone})</option>
                  ))
                }
              </select>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button 
                onClick={() => setShowTransferModal(false)} 
                className="btn-secondary"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleTransfer} 
                className="btn"
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}