import { useState } from 'react';

export default function useDeviceForm(initialData = {}) {
  // Khởi tạo form với dữ liệu ban đầu hoặc trống
  const defaultData = {
    name: '',
    image: '',
    locationImage: '',
    purchaseDate: '',
    warrantyEnd: '',
    warrantyPlace: '',
    notes: ''
  };
  
  const [formData, setFormData] = useState({...defaultData, ...initialData});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showTooltip, setShowTooltip] = useState(null);
  const [imagePreview, setImagePreview] = useState({
    device: initialData?.image || '',
    location: initialData?.locationImage || ''
  });
  
  // Xử lý thay đổi form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Xử lý upload ảnh
  const handleImageUpload = (field) => (imagePath) => {
    setFormData(prev => ({ ...prev, [field]: imagePath }));
    const type = field === 'image' ? 'device' : 'location';
    setImagePreview(prev => ({ ...prev, [type]: imagePath }));
  };
  
  // Xóa ảnh
  const handleDeleteImage = (field) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
    
    const type = field === 'image' ? 'device' : 'location';
    setImagePreview(prev => ({ ...prev, [type]: '' }));
  };
  
  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Tên thiết bị là bắt buộc');
      return false;
    }
    
    return true;
  };
  
  return {
    formData,
    setFormData,
    isSubmitting,
    setIsSubmitting,
    error,
    setError,
    showTooltip,
    setShowTooltip,
    imagePreview,
    setImagePreview, // Thêm để component edit có thể cập nhật
    handleChange,
    handleImageUpload,
    handleDeleteImage,
    validateForm
  };
}