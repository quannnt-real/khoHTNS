import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useDeviceForm from '../../../hooks/useDeviceForm';
import DeviceForm from '../../../components/DeviceForm';

export default function EditDevice() {
  const router = useRouter();
  const { id } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  
  // Sử dụng hook với giá trị ban đầu rỗng
  const deviceForm = useDeviceForm({});
  
  // Fetch dữ liệu thiết bị
  useEffect(() => {
    if (!id) return;
    
    const fetchDevice = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/devices/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Không thể tải thông tin thiết bị');
        }
        
        const deviceData = await response.json();
        
        // Cập nhật formData từ hook
        deviceForm.setFormData(deviceData);
        
        // Cập nhật imagePreview
        if (deviceData.image || deviceData.locationImage) {
          deviceForm.setImagePreview({
            device: deviceData.image || '',
            location: deviceData.locationImage || ''
          });
        }
      } catch (err) {
        console.error('Error fetching device:', err);
        setFetchError(err.message || 'Đã xảy ra lỗi khi tải thông tin thiết bị');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDevice();
  }, [id]);
  
  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!deviceForm.validateForm()) return;
    
    deviceForm.setIsSubmitting(true);
    deviceForm.setError('');
    
    try {
      const response = await fetch(`/api/devices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceForm.formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi cập nhật thiết bị');
      }
      
      router.push('/');
    } catch (err) {
      console.error('Lỗi khi cập nhật thiết bị:', err);
      deviceForm.setError(err.message || 'Lỗi khi cập nhật thiết bị. Vui lòng thử lại.');
    } finally {
      deviceForm.setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <div className="p-10 text-center">Đang tải thông tin thiết bị...</div>;
  }
  
  if (fetchError) {
    return (
      <div className="p-10">
        <div className="bg-red-50 p-4 rounded-md border-l-4 border-red-500 text-red-700">
          <p>Lỗi: {fetchError}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-3 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <DeviceForm
      {...deviceForm}
      handleSubmit={handleSubmit}
      mode="edit"
    />
  );
}