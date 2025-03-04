import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    phone: '',
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [systemMessage, setSystemMessage] = useState('');
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Không thể tải danh sách người dùng. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };
  

  const validateForm = () => {

    if (!newUser.name.trim() || !newUser.phone.trim() || !newUser.password.trim()) {
      setFormError('Tên, số điện thoại và mật khẩu là bắt buộc');
      return false;
    }

    // Check password length
    if (newUser.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    // Validate phone format
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(newUser.phone)) {
      setError('Số điện thoại không hợp lệ');
      return false;
    }

    // Validate email if provided
    if (newUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUser.email)) {
        setError('Email không hợp lệ');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Remove confirmPassword before sending

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký không thành công');
      }
      // Thông báo thành công (tùy chọn)
      // Reset form và đóng modal
      setNewUser({ name: '', phone: '', email: '', password: '' });
      setShowAddForm(false);
      setError('');
      // Làm mới danh sách người dùng
      await fetchUsers();

      // Hiển thị thông báo hệ thống
      setSystemMessage('Người dùng đã được tạo thành công!');
      // Tự động ẩn thông báo sau 3 giây (tùy chọn)
      setTimeout(() => setSystemMessage(''), 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${userName}" không?`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Delete error response:', data);
        throw new Error(data.message || 'Không thể xóa người dùng');
      }
       // Làm mới danh sách người dùng
       await fetchUsers();

       // Hiển thị thông báo hệ thống
       setSystemMessage('Xóa người dùng thành công');
       // Tự động ẩn thông báo sau 3 giây (tùy chọn)
       setTimeout(() => setSystemMessage(''), 3000);

    } catch (err) {
      console.error('Error deleting user:', {
        error: err,
        message: err.message,
        stack: err.stack
      });
      setError(err.message || 'Không thể xóa người dùng. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users by search query
  const filteredUsers = searchQuery 
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery)
      )
    : users;
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const getTotalDevices = (user) => {
    // Nếu dùng cấu trúc mới
    if (user.borrowedDevicesCount) {
      return user.borrowedDevicesCount.total;
    }
    
    // Fallback cho cấu trúc cũ
    const directBorrowCount = user.borrowedDevices?.length || 0;
    const eventCount = user.createdEvents?.reduce((total, event) => 
      total + (event._count?.eventDevices || 0), 0) || 0;
    
    return directBorrowCount + eventCount;
  };
  
  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="mr-3 bg-purple-100 p-2 rounded-lg">
              <FontAwesomeIcon icon="users" className="h-6 w-6 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Người Dùng</h1>
          </div>
          <button 
            onClick={() => setShowAddForm(true)} 
            className="btn"
          >
            <FontAwesomeIcon icon="user-plus" className="mr-2" />
            Thêm Người Dùng Mới
          </button>
        </div>
      </div>
      
      {/* Search and filter */}
      <div className="mb-6">
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FontAwesomeIcon icon="search" className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="form-input pl-10"
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 p-6 rounded-lg border border-red-100 mb-6">
          <div className="flex items-center">
            <FontAwesomeIcon icon="exclamation-circle" className="h-6 w-6 text-red-500 mr-3" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Thông báo hệ thống */}
      {systemMessage && (
        <div className="bg-green-50 p-6 rounded-lg border border-green-100 mb-6">
          <div className="flex items-center">
            <FontAwesomeIcon icon="check-circle" className="h-6 w-6 text-green-500 mr-3" />
            <p className="text-green-800">{systemMessage}</p>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-12">
          <FontAwesomeIcon icon="circle-notch" spin className="h-8 w-8 text-indigo-500 mb-4" />
          <p className="text-gray-500">Đang tải người dùng...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex items-center flex-col py-12 bg-white rounded-lg shadow-sm border border-gray-100">
          <FontAwesomeIcon icon="users" className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-500 mb-2">Không tìm thấy người dùng nào</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery 
              ? 'Không có người dùng nào phù hợp với tìm kiếm của bạn' 
              : 'Hãy thêm người dùng đầu tiên vào hệ thống'}
          </p>
          {!searchQuery && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="btn"
            >
              <FontAwesomeIcon icon="user-plus" className="mr-2" />
              Thêm Người Dùng Đầu Tiên
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="table-header">
                    Tên
                  </th>
                  <th className="table-header">
                    Số Điện Thoại
                  </th>
                  <th className="table-header">
                    Thiết Bị Đang Mượn
                  </th>
                  <th className="table-header text-right">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <FontAwesomeIcon icon="user" className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon="phone" className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{user.phone}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <Link href={`/users/${user.id}`} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200">
                        <FontAwesomeIcon icon="boxes" className="mr-1 h-3 w-3" /> 
                        {getTotalDevices(user)} thiết bị
                      </Link>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex justify-end items-center space-x-3">
                        <Link 
                          href={`/users/${user.id}`}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50 transition-colors duration-150"
                          title="Xem chi tiết"
                        >
                          <FontAwesomeIcon icon="eye" />
                        </Link>
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.name)} 
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors duration-150"
                          title="Xóa người dùng"
                          disabled={user.borrowedDevices?.length > 0}
                        >
                          <FontAwesomeIcon icon="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Add User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-medium">Thêm Người Dùng Mới</h3>
              <button 
                onClick={() => setShowAddForm(false)}
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
                    value={newUser.name}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="phone" className="form-label">Số Điện Thoại <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon="phone" className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Nhập số điện thoại"
                    value={newUser.phone}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="form-label">Email <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon="envelope" className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Nhập email"
                    value={newUser.email}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label">Mật Khẩu <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon="lock" className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Nhập mật khẩu"
                    value={newUser.password}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)} 
                  className="btn-outline"
                  disabled={isSubmitting}
                >
                  <FontAwesomeIcon icon="times" className="mr-2" />
                  Hủy Bỏ
                </button>
                <button 
                  type="submit"
                  className="btn"
                  disabled={isSubmitting}
                >
                  <FontAwesomeIcon icon={isSubmitting ? 'circle-notch' : 'save'} className={`mr-2 ${isSubmitting ? 'animate-spin' : ''}`} />
                  {isSubmitting ? 'Đang Lưu...' : 'Lưu Người Dùng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}