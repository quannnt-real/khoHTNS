import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ImageUpload from '../../components/ImageUpload';

export default function NewDevice() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    locationImage: '',
    purchaseDate: '',
    warrantyEnd: '',
    warrantyPlace: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageUpload = (field) => (imagePath) => {
    setFormData(prev => ({ ...prev, [field]: imagePath }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      setError('Tên thiết bị là bắt buộc');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi thêm thiết bị');
      }
      
      // Redirect to device list page after successful creation
      if (router) {
        router.push('/');
      }
    } catch (err) {
      console.error('Lỗi khi tạo thiết bị:', err);
      setError(err.message || 'Lỗi khi thêm thiết bị. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Thêm Thiết Bị Mới</h1>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-4">
          <label htmlFor="name" className="form-label">Tên Thiết Bị <span className="text-red-500">*</span></label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <ImageUpload
          onImageUpload={handleImageUpload('image')}
          currentImage={formData.image}
          label="Hình Ảnh Thiết Bị"
        />
        
        <ImageUpload
          onImageUpload={handleImageUpload('locationImage')}
          currentImage={formData.locationImage}
          label="Vị Trí Lưu Trữ"
        />
        
        <div className="mb-4">
          <label htmlFor="purchaseDate" className="form-label">Ngày Mua</label>
          <input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            value={formData.purchaseDate}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="warrantyEnd" className="form-label">Ngày Hết Hạn Bảo Hành</label>
          <input
            type="date"
            id="warrantyEnd"
            name="warrantyEnd"
            value={formData.warrantyEnd}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="warrantyPlace" className="form-label">Nơi Bảo Hành</label>
          <input
            type="text"
            id="warrantyPlace"
            name="warrantyPlace"
            value={formData.warrantyPlace}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="notes" className="form-label">Ghi Chú</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="form-input"
            rows="3"
          ></textarea>
        </div>
        
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            className="btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang Lưu...' : 'Lưu Thiết Bị'}
          </button>
          <Link href="/" className="btn-secondary">
            Hủy Bỏ
          </Link>
        </div>
      </form>
    </div>
  );
}