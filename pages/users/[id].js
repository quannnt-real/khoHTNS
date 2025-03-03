import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function UserDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [borrowedDevices, setBorrowedDevices] = useState([]);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit user form
  const [showEditForm, setShowEditForm] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: '',
    phone: '',
    email: '',
    role: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  useEffect(() => {
    // Get current logged in user
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setCurrentUser(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    if (id) {
      fetchUser();
    }
  }, [id]);
  
  const fetchUser = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/users/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể tải thông tin người dùng');
      }
      
      const data = await response.json();
      setUser(data);
      setEditedUser({
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        role: data.role
      });
      
      // Set borrowed devices
      if (data.borrowedDevices) {
        setBorrowedDevices(data.borrowedDevices);
      }
      
      // Set borrow history
      if (data.borrowHistory) {
        setBorrowHistory(data.borrowHistory);
      }
      
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err.message || 'Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  };
  
  const validateForm = () => {
    if (!editedUser.name.trim() || !editedUser.phone.trim()) {
      setFormError('Tên và số điện thoại là bắt buộc');
      return false;
    }
    
    // Validate phone format
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(editedUser.phone)) {
      setFormError('Số điện thoại không hợp lệ');
      return false;
    }
    
    // Validate email if provided
    if (editedUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editedUser.email)) {
        setFormError('Email không hợp lệ');
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setFormError('');
    
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedUser)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Không thể cập nhật thông tin người dùng');
      }
      
      setUser(prev => ({
        ...prev,
        name: editedUser.name,
        phone: editedUser.phone,
        email: editedUser.email,
        role: editedUser.role
      }));
      
      setShowEditForm(false);
      
      // Update current user in localStorage if it's the same user
      if (currentUser && currentUser.id === id) {
        const updatedUser = { ...currentUser, ...editedUser };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
      }
      
    } catch (err) {
      console.error('Error updating user:', err);
      setFormError(err.message || 'Không thể cập nhật thông tin người dùng. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này không?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Không thể xóa người dùng');
      }
      
      router.push('/users');
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Không thể xóa người dùng. Vui lòng thử lại sau.');
    }
  };
  
  // Check if the current user is an admin or the same user
  const canEditUser = currentUser && (currentUser.role === 'admin' || currentUser.id === id);
  
  // Only admin can change role
  const canEditRole = currentUser && currentUser.role === 'admin';
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <FontAwesomeIcon icon="circle-notch" spin className="h-8 w-8 text-indigo-500 mb-4" />
        <p className="text-gray-500">Đang tải thông tin người dùng...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-100 mb-6">
        <div className="flex items-center">
          <FontAwesomeIcon icon="exclamation-circle" className="h-6 w-6 text-red-500 mr-3" />
          <p className="text-red-800">{error}</p>
        </div>
        <Link href="/users" className="btn mt-4 inline-block">
          Trở lại danh sách người dùng
        </Link>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="text-center py-8">
        <p>Không tìm thấy người dùng</p>
        <Link href="/users" className="btn mt-4 inline-block">
          Trở lại danh sách người dùng
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="mr-3 bg-purple-100 p-2 rounded-lg">
              <FontAwesomeIcon icon="user" className="h-6 w-6 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Thông tin người dùng</h1>
          </div>
          <div className="flex space-x-2">
            {canEditUser && (
              <button 
                onClick={() => setShowEditForm(true)} 
                className="btn-secondary"
              >
                <FontAwesomeIcon icon="edit" className="mr-2" />
                Chỉnh sửa
              </button>
            )}
            {canEditRole && borrowedDevices.length === 0 && (
              <button 
                onClick={handleDelete} 
                className="btn-danger"
                disabled={borrowedDevices.length > 0}
              >
                <FontAwesomeIcon icon="trash" className="mr-2" />
                Xóa
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex justify-center mb-6">
                <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center">
                  <FontAwesomeIcon icon="user" className="h-12 w-12 text-purple-600" />
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                <p className="text-gray-500 mt-1">
                  {user.role === 'admin' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Quản trị viên
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Người dùng
                    </span>
                  )}
                </p>
              </div>
              
              <div className="border-t border-gray-200 py-4">
                <div className="flex items-center py-2">
                  <FontAwesomeIcon icon="phone" className="h-5 w-5 text-gray-400 mr-3" />
                  <span>{user.phone}</span>
                </div>
                
                {user.email && (
                  <div className="flex items-center py-2">
                    <FontAwesomeIcon icon="envelope" className="h-5 w-5 text-gray-400 mr-3" />
                    <span>{user.email}</span>
                  </div>
                )}
                
                <div className="flex items-center py-2">
                  <FontAwesomeIcon icon="clock" className="h-5 w-5 text-gray-400 mr-3" />
                  <span>Tham gia: {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon="boxes" className="h-5 w-5 text-indigo-500 mr-3" />
                    <span className="font-medium">Đang mượn:</span>
                  </div>
                  <span className="text-xl font-bold text-indigo-600">{borrowedDevices.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">Thiết bị đang mượn</h3>
            </div>
            
            {borrowedDevices.length === 0 ? (
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                  <FontAwesomeIcon icon="box" className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">Hiện tại không có thiết bị nào đang được mượn</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {borrowedDevices.map((device) => (
                  <div key={device.id} className="p-4 hover:bg-gray-50">
                    <Link href={`/devices/${device.id}`} className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 relative overflow-hidden rounded-md mr-4">
                        {device.image ? (
                          <Image
                            src={device.image}
                            alt={device.name}
                            className="object-cover"
                            fill
                            unoptimized={true}
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                            <FontAwesomeIcon icon="box" className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-gray-900">{device.name}</h4>
                        <p className="text-sm text-gray-500">
                          {device.borrowHistory && device.borrowHistory.length > 0 && 
                            `Mượn từ: ${new Date(device.borrowHistory[0].borrowDate).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                      <div className="ml-auto">
                        <FontAwesomeIcon icon="chevron-right" className="h-4 w-4 text-gray-400" />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {borrowHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium">Lịch sử mượn/trả</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thiết bị
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày mượn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày trả
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chuyển cho
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {borrowHistory.map((history) => (
                      <tr key={history.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link 
                            href={`/devices/${history.deviceId}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {history.device?.name || "Thiết bị đã xóa"}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(history.borrowDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {history.returnDate ? 
                            new Date(history.returnDate).toLocaleDateString() : 
                            history.transferStatus ? 'Đã chuyển' : '—'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {history.transferTo ? (
                            <Link 
                              href={`/users/${history.transferTo.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              {history.transferTo.name}
                            </Link>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit User Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-medium">Chỉnh sửa thông tin người dùng</h3>
              <button 
                onClick={() => setShowEditForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <FontAwesomeIcon icon="times" className="h-5 w-5" />
              </button>
            </div>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-center">
                <FontAwesomeIcon icon="exclamation-circle" className="mr-2 h-4 w-4" />
                {formError}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="form-label">Tên <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon="user" className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Nhập tên người dùng"
                    value={editedUser.name}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="phone" className="form-label">Số điện thoại <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon="phone" className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Nhập số điện thoại"
                    value={editedUser.phone}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="form-label">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon="envelope" className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Nhập email"
                    value={editedUser.email}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                  />
                </div>
              </div>
              
              {canEditRole && (
                <div className="mb-4">
                  <label htmlFor="role" className="form-label">Phân quyền</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon="key" className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="role"
                      name="role"
                      value={editedUser.role}
                      onChange={handleInputChange}
                      className="form-input pl-10"
                    >
                      <option value="user">Người dùng</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowEditForm(false)} 
                  className="btn-outline"
                  disabled={isSubmitting}
                >
                  <FontAwesomeIcon icon="times" className="mr-2" />
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="btn"
                  disabled={isSubmitting}
                >
                  <FontAwesomeIcon icon={isSubmitting ? 'circle-notch' : 'save'} className={`mr-2 ${isSubmitting ? 'animate-spin' : ''}`} />
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}