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

  useEffect(() => {
    if (id) {
      fetchEvent();
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
        
        {event.status === 'ongoing' && (
          <Link
            href={`/events/${id}/return`}
            className="btn"
          >
            Trả thiết bị
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Mã sự kiện #{id.substring(0, 8)}</h2>
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
            
            {event.status === 'completed' && (
              <>
                <div>
                  <p className="text-sm text-gray-500">Ngày trả</p>
                  <p>{event.returnedDate ? new Date(event.returnedDate).toLocaleString() : 'N/A'}</p>
                </div>
                
                {event.updater && (
                  <div>
                    <p className="text-sm text-gray-500">Người cập nhật</p>
                    <p>{event.updater.name} ({event.updater.phone})</p>
                  </div>
                )}
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
    </div>
  );
}