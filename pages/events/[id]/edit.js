import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

export default function EditEvent() {
  const router = useRouter();
  const { id } = router.query;
  
  const [event, setEvent] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
  });

  useEffect(() => {
    if (id) {
      fetchEvent();
      fetchDevices();
      // Lấy thông tin người dùng hiện tại từ localStorage
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
        }
      } catch (err) {
        console.error('Error parsing user from localStorage:', err);
      }
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
      
      // Đổ dữ liệu vào form
      setFormData({
        title: data.title,
      });
      
      // Đánh dấu các thiết bị đã được chọn trong sự kiện
      if (data.eventDevices && data.eventDevices.length > 0) {
        setSelectedDevices(data.eventDevices.map(ed => ed.device));
      }
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      if (!response.ok) {
        throw new Error('Không thể tải danh sách thiết bị');
      }
      const data = await response.json();
      setDevices(data);
      
      // Lọc ra thiết bị có sẵn (không được mượn hoặc đang được mượn trong sự kiện này)
      setAvailableDevices(data.filter(device => 
        device.status === 'available' || 
        (device.event && device.event.id === id)
      ));
    } catch (err) {
      console.error('Error fetching devices:', err);
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    
    if (!formData.title.trim()) {
      setError('Tiêu đề sự kiện là bắt buộc');
      return;
    }
    
    if (selectedDevices.length === 0) {
      setError('Vui lòng chọn ít nhất một thiết bị');
      return;
    }
    
    try {
      setIsSaving(true);
      setError('');
      let user;
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) throw new Error('Vui lòng đăng nhập để mượn thiết bị');
        user = JSON.parse(userStr);
      } catch (err) {
        throw new Error('Vui lòng đăng nhập để mượn thiết bị');
      }


      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          updaterId: user.id,
          deviceIds: selectedDevices.map(device => device.id)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể cập nhật sự kiện');
      }
      
      // Điều hướng về trang chi tiết sự kiện sau khi cập nhật thành công
      router.push(`/events/${id}`);
    } catch (err) {
      console.error('Error updating event:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Hiển thị loading
  if (isLoading) {
    return <div className="text-center py-8">Đang tải thông tin...</div>;
  }

  // Hiển thị lỗi
  if (error && !event) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">{error}</p>
        <Link href={`/events/${id}`} className="btn mt-4">
          Quay lại chi tiết sự kiện
        </Link>
      </div>
    );
  }

  // Không tìm thấy sự kiện
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
          <h1 className="text-2xl font-bold">Chỉnh sửa phiếu mượn</h1>
          <p className="text-gray-600 mt-1">
          Phiếu #{id.substring(0, 8)} - Người mượn: {event?.creator?.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}
        
        {/* Thông tin cơ bản sự kiện */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Thông tin cơ bản</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề sự kiện
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            {/* Hiển thị thông tin người cập nhật nhưng không cho phép sửa */}
            <div>
              <p className="text-sm text-gray-500">
                Người cập nhật: <span className="font-medium">{event?.creator?.name} ({event?.creator?.phone})</span>
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Người cập nhật là người thay đổi thông tin sự kiện và thiết bị mượn
              </p>
            </div>
          </div>
        </div>
        
        {/* Chọn thiết bị */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Quản lý thiết bị mượn</h2>
          
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
          
          {/* Thiết bị hiện tại trong sự kiện */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Thiết bị đang mượn trong sự kiện</h3>
            {event.eventDevices.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Không có thiết bị nào trong sự kiện này</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {event.eventDevices.map(eventDevice => (
                  <div 
                    key={eventDevice.id}
                    className={`border rounded-md overflow-hidden ${
                      selectedDevices.some(d => d.id === eventDevice.device.id) 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex p-3">
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
                      
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium">{eventDevice.device.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Trạng thái: <span className="font-medium text-yellow-600">Đang mượn trong sự kiện</span>
                        </p>
                      </div>
                      
                      <div className="ml-3 flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedDevices.some(d => d.id === eventDevice.device.id)}
                          onChange={() => toggleDeviceSelection(eventDevice.device)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Các thiết bị có sẵn khác */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Các thiết bị có sẵn</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices
                .filter(device => 
                  device.status === 'available' && 
                  !event.eventDevices.some(ed => ed.device.id === device.id)
                )
                .map(device => (
                  <div 
                    key={device.id}
                    className={`border rounded-md overflow-hidden ${
                      selectedDevices.some(d => d.id === device.id) 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200'
                    }`}
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
                          Trạng thái: <span className="font-medium text-green-600">Có sẵn</span>
                        </p>
                      </div>
                      
                      <div className="ml-3 flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedDevices.some(d => d.id === device.id)}
                          onChange={() => toggleDeviceSelection(device)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              
              {devices.filter(device => 
                device.status === 'available' && 
                !event.eventDevices.some(ed => ed.device.id === device.id)
              ).length === 0 && (
                <p className="text-sm text-gray-500 italic col-span-3">Không có thiết bị nào khả dụng</p>
              )}
            </div>
          </div>
          
          {/* Cảnh báo thiết bị không khả dụng */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Thiết bị không khả dụng</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices
                .filter(device => 
                  device.status === 'borrowed' && 
                  !event.eventDevices.some(ed => ed.device.id === device.id)
                )
                .map(device => (
                  <div 
                    key={device.id}
                    className="border border-gray-200 rounded-md overflow-hidden opacity-50"
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
                          Trạng thái: <span className="font-medium text-red-600">Đang được mượn</span>
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
                          disabled
                          className="h-4 w-4 rounded border-gray-300 text-gray-400 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              
              {devices.filter(device => 
                device.status === 'borrowed' && 
                !event.eventDevices.some(ed => ed.device.id === device.id)
              ).length === 0 && (
                <p className="text-sm text-gray-500 italic col-span-3">Không có thiết bị nào đang được mượn</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Link
            href={`/events/${id}`}
            className="btn-outline"
          >
            Hủy
          </Link>
          <button
            type="submit"
            className="btn flex items-center"
            disabled={isSaving || selectedDevices.length === 0}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu...
              </>
            ) : (
              <>Lưu thay đổi</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}