import { useRouter } from 'next/router';
import useDeviceForm from '../../hooks/useDeviceForm';
import DeviceForm from '../../components/DeviceForm';

export default function NewDevice() {
  const router = useRouter();
  const deviceForm = useDeviceForm();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!deviceForm.validateForm()) return;
    
    deviceForm.setIsSubmitting(true);
    deviceForm.setError('');
    
    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceForm.formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi thêm thiết bị');
      }
      
      router.push('/');
    } catch (err) {
      console.error('Lỗi khi tạo thiết bị:', err);
      deviceForm.setError(err.message || 'Lỗi khi thêm thiết bị. Vui lòng thử lại.');
    } finally {
      deviceForm.setIsSubmitting(false);
    }
  };
  
  // Sử dụng spread operator để truyền tất cả các props từ deviceForm
  return (
    <DeviceForm
      {...deviceForm}
      handleSubmit={handleSubmit}
      mode="create"
    />
  );
}