import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DeviceCard from '../components/DeviceCard';

export default function Home() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    borrowed: 0
  });
  
  useEffect(() => {
    fetchDevices();
  }, [filter]);
  
  const fetchDevices = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const endpoint = filter === 'all' 
        ? '/api/devices' 
        : `/api/devices?status=${filter}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể tải danh sách thiết bị');
      }
      
      const data = await response.json();
      setDevices(data);
      
      // Update stats
      const availableCount = data.filter(d => d.status === 'available').length;
      const borrowedCount = data.filter(d => d.status === 'borrowed').length;
      setStats({
        total: data.length,
        available: availableCount,
        borrowed: borrowedCount
      });
      
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError('Không thể tải danh sách thiết bị. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter devices by search query
  const filteredDevices = searchQuery 
    ? devices.filter(device => 
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (device.borrower && device.borrower.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : devices;
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  return (
    <div>
      {/* Header with stats */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản Lý Thiết Bị</h1>
          <Link href="/devices/new" className="btn w-full sm:w-auto text-center">
            <FontAwesomeIcon icon="plus" className="mr-2" />
            Thêm Thiết Bị Mới
          </Link>
        </div>
        
        {/* Stats cards - optimized for mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="card p-6 flex items-center flex-row gap-3">
            <div className="rounded-full bg-indigo-100 p-3 mr-0 sm:mr-4">
              <FontAwesomeIcon icon="warehouse" className="h-6 w-6 text-indigo-600" />
            </div>
            <div className='flex flex-row md:flex-col items-center sm:items-start w-full md:w-auto justify-between'>
              <h3 className="text-lg font-medium text-gray-700">Tổng Thiết Bị</h3>
              <p className="text-2xl font-bold text-indigo-600">{stats.total}</p>
            </div>
          </div>
          
          <div className="card p-6 flex items-center flex-row gap-3">
            <div className="rounded-full bg-indigo-100 p-3 mr-0 sm:mr-4">
              <FontAwesomeIcon icon="check" className="h-6 w-6 text-emerald-600" />
            </div>
            <div className='flex flex-row md:flex-col items-center sm:items-start w-full md:w-auto justify-between'>
              <h3 className="text-lg font-medium text-gray-700">Có Sẵn</h3>
              <p className="text-2xl font-bold text-emerald-600">{stats.available}</p>
            </div>
          </div>
          
          <div className="card p-6 flex items-center flex-row gap-3">
            <div className="rounded-full bg-indigo-100 p-3 mr-0 sm:mr-4">
              <FontAwesomeIcon icon="hand-holding" className="h-6 w-6 text-amber-600" />
            </div>
            <div className='flex flex-row md:flex-col items-center sm:items-start w-full md:w-auto justify-between'>
              <h3 className="text-lg font-medium text-gray-700">Đang Mượn</h3>
              <p className="text-2xl font-bold text-amber-600">{stats.borrowed}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and search */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="grid grid-cols-3 w-full md:w-auto shadow-sm" role="group">
          <button 
            onClick={() => setFilter('all')}
            className={`px-2 py-2 text-xs sm:text-sm font-medium rounded-l-lg border border-gray-200
              ${filter === 'all' 
                ? 'bg-indigo-100 text-indigo-700 border-indigo-100' 
                : 'bg-white text-gray-700'
              }`}
          >
            <FontAwesomeIcon icon="boxes" className="mr-1 sm:mr-2 text-xl sm:text-base" />
            <span className="hidden sm:inline">Tất Cả</span>
          </button>
          <button 
            onClick={() => setFilter('available')}
            className={`px-2 py-2 text-xs sm:text-sm font-medium border border-gray-200
              ${filter === 'available' 
                ? 'bg-emerald-100 text-emerald-700 border-emerald-100' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <FontAwesomeIcon icon="check" className="mr-1 sm:mr-2 text-xl sm:text-base" />
            <span className="hidden sm:inline">Có Sẵn</span>
          </button>
          <button 
            onClick={() => setFilter('borrowed')}
            className={`px-2 py-2 text-xs sm:text-sm font-medium rounded-r-lg border border-gray-200
              ${filter === 'borrowed' 
                ? 'bg-amber-100 text-amber-700 border-amber-100' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <FontAwesomeIcon icon="hand-holding" className="mr-1 sm:mr-2 text-xl sm:text-base" />
            <span className="hidden sm:inline">Đang Mượn</span>
          </button>
        </div>
        
        <div className="relative w-full md:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FontAwesomeIcon icon="search" className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="form-input pl-10 w-full"
            placeholder="Tìm kiếm thiết bị..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      
      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <FontAwesomeIcon icon="circle-notch" spin className="h-8 w-8 text-indigo-500 mb-4" />
          <p className="text-gray-500">Đang tải thiết bị...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-lg border border-red-100">
          <div className="flex items-center">
            <FontAwesomeIcon icon="exclamation-circle" className="h-6 w-6 text-red-500 mr-3" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="flex items-center flex-col py-12 bg-white rounded-lg shadow-sm border border-gray-100">
          <FontAwesomeIcon icon="box-open" className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-500 mb-2">Không tìm thấy thiết bị nào</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery 
              ? 'Không có thiết bị nào phù hợp với tìm kiếm của bạn' 
              : 'Hãy thêm thiết bị đầu tiên vào kho của bạn'}
          </p>
          {!searchQuery && (
            <Link href="/devices/new" className="btn">
              <FontAwesomeIcon icon="plus" className="mr-2" />
              Thêm Thiết Bị Đầu Tiên
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.map(device => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}
    </div>
  );
}