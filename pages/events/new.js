import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

export default function NewEvent() {
  const router = useRouter();
  
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [title, setTitle] = useState(''); // Thêm state cho title
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchDevices();
  }, []);
  
  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      
      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }
      
      const data = await response.json();
      setDevices(data);
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError('Failed to load devices. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleDeviceSelection = (device) => {
    setSelectedDevices(prev => {
      const isSelected = prev.some(d => d.id === device.id);
      
      if (isSelected) {
        return prev.filter(d => d.id !== device.id);
      } else {
        return [...prev, device];
      }
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedDevices.length === 0) {
      setError('Vui lòng chọn ít nhất một thiết bị');
      return;
    }
    
    if (!title) {
      setError('Vui lòng nhập tiêu đề phiếu mượn');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Lấy thông tin user từ localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('Vui lòng đăng nhập để tạo phiếu mượn');
      }
      const user = JSON.parse(userStr);

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          deviceIds: selectedDevices.map(device => device.id),
          creatorId: user.id  // Sử dụng ID của người dùng đang đăng nhập
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi tạo phiếu mượn');
      }
      
      const data = await response.json();
      router.push(`/events/${data.id || ''}`);
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.message || 'Lỗi khi tạo phiếu mượn. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>Đang tải...</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tạo phiếu mượn thiết bị cho sự kiện</h1>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thêm phần nhập thông tin cơ bản */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Thông tin sự kiện</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Tên sự kiện <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Nhập tên sự kiện"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Chọn thiết bị mượn</h2>
          
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Đã chọn: {selectedDevices.length} thiết bị
            </p>
            
            {selectedDevices.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedDevices([])}
                className="text-sm text-red-600"
              >
                Xóa lựa chọn
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {devices.map(device => {
              const isSelected = selectedDevices.some(d => d.id === device.id);
              const isAvailable = device.status === 'available';
              
              return (
                <div 
                  key={device.id}
                  className={`border rounded-md overflow-hidden ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                  } ${isAvailable ? 'opacity-100' : 'opacity-50'}`}
                >
                  <div className="flex p-3">
                    <div className="w-16 h-16 flex-shrink-0 relative rounded-md overflow-hidden">
                      {device.image ? (
                        <Image 
                          src={device.image}
                          alt={device.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="bg-gray-100 w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium">{device.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Trạng thái: <span className={`font-medium ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                          {isAvailable ? 'Có sẵn' : 'Đang được mượn'}
                        </span>
                      </p>
                      {device.borrower && (
                        <p className="text-xs text-gray-500 mt-1">
                          Người đang mượn: {device.borrower.name}
                        </p>
                      )}
                    </div>
                    
                    <div className="ml-3 flex items-start">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDeviceSelection(device)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={!isAvailable}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {devices.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No devices available</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <Link href="/events" className="btn-secondary">
            Hủy
          </Link>
          <button
            type="submit"
            className="btn"
            disabled={isSubmitting || selectedDevices.length === 0}
          >
            {isSubmitting ? 'Đang tạo...' : 'Tạo phiếu mượn'}
          </button>
        </div>
      </form>
    </div>
  );
}