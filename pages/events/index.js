import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    ongoing: 0,
    completed: 0
  });

  useEffect(() => {
    fetchEvents();
  }, [filter]);
  
  const fetchEvents = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const endpoint = filter === 'all' 
        ? '/api/events' 
        : `/api/events?status=${filter}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể tải danh sách sự kiện');
      }
      
      const data = await response.json();
      // console.log('Fetched events:', data);
      setEvents(data);

      // Update stats
      const ongoingCount = data.filter(d => d.status === 'ongoing').length;
      const completedCount = data.filter(d => d.status === 'completed').length;
      
      console.log('ongoingCount: ' + ongoingCount, 'completedCount: ' + completedCount);

      setStats({
        total: data.length,
        ongoing: ongoingCount,
        completed: completedCount
      });
      
    } catch (err) {
      console.error('Error details:', err);
      setError('Không thể tải danh sách sự kiện. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Phiếu Mượn Sự Kiện</h1>
        <Link href="/events/new" className="btn">
          Tạo Phiếu mượn mới cho sự kiện
        </Link>
      </div>
      
      <div className="mb-6">
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'all' 
                ? 'bg-blue-200 text-blue-700' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Tất Cả
          </button>
          <button 
            onClick={() => setFilter('ongoing')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'ongoing' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Đang Diễn Ra
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Đã Hoàn Thành
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-8">
          <p>Đang tải...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Không tìm thấy sự kiện nào.</p>
          <Link href="/events/new" className="btn mt-4 inline-block">
            Tạo Sự Kiện Đầu Tiên
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên Sự Kiện
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày Tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người Tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thiết Bị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng Thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/events/${event.id}`}
                        className="text-blue-800 hover:text-blue-500 text-sm font-bold"
                      >
                          {event.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(event.createdDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(event.createdDate).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {event.creator.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {event.creator.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {event.eventDevices.length} thiết bị
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.status === 'completed' ? 'Đã Hoàn Trả' : 'Đang Diễn Ra'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link 
                          href={`/events/${event.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Xem
                        </Link>
                        {event.status === 'ongoing' && (
                          <Link 
                            href={`/events/${event.id}/return`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Trả Thiết Bị
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}