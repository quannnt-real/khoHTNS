import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function EditDevice() {
  const router = useRouter();
  const { id } = router.query;
  
  const [device, setDevice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image upload states
  const [deviceImage, setDeviceImage] = useState('');
  const [locationImage, setLocationImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchDevice();
    }
  }, [id]);
  
  const fetchDevice = async () => {
    try {
      const response = await fetch(`/api/devices/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể tải thông tin thiết bị');
      }
      
      const data = await response.json();
      setDevice(data);
      setDeviceImage(data.image || '');
      setLocationImage(data.locationImage || '');
    } catch (err) {
      console.error('Error fetching device:', err);
      setError(err.message || 'Không thể tải thông tin thiết bị. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDevice((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      
      if (type === 'device') {
        setDeviceImage(data.imagePath);
        setDevice(prev => ({ ...prev, image: data.imagePath }));
      } else if (type === 'location') {
        setLocationImage(data.imagePath);
        setDevice(prev => ({ ...prev, locationImage: data.imagePath }));
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setSubmitError('Không thể tải lên hình ảnh. Vui lòng thử lại.');
    } finally {
      setUploadingImage(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Remove relationships data before submitting
      const { borrower, borrowHistory, event, eventDevices, formattedHistory, canReturn, ...deviceData } = device;
      
      const response = await fetch(`/api/devices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviceData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể cập nhật thiết bị');
      }
      
      router.push(`/devices/${id}`);
    } catch (err) {
      console.error('Error updating device:', err);
      setSubmitError(err.message || 'Không thể cập nhật thiết bị. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>Đang tải thông tin thiết bị...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">{error}</p>
        <Link href={`/devices/${id}`} className="btn mt-4 inline-block">
          Quay lại trang chi tiết
        </Link>
      </div>
    );
  }
  
  if (!device) {
    return (
      <div className="text-center py-8">
        <p>Không tìm thấy thiết bị</p>
        <Link href="/" className="btn mt-4 inline-block">
          Trở lại danh sách thiết bị
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chỉnh sửa: {device.name}</h1>
        <Link href={`/devices/${id}`} className="btn-secondary">
          Hủy
        </Link>
      </div>
      
      {submitError && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-800">{submitError}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
              
              <div className="mb-4">
                <label htmlFor="name" className="form-label">Tên thiết bị <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={device.name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="status" className="form-label">Trạng thái</label>
                <select
                  id="status"
                  name="status"
                  value={device.status}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={device.borrowerId}
                >
                  <option value="available">Có sẵn</option>
                  <option value="borrowed">Đang mượn</option>
                </select>
                {device.borrowerId && (
                  <p className="text-sm text-amber-600 mt-1">Không thể thay đổi trạng thái khi thiết bị đang được mượn</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="purchaseDate" className="form-label">Ngày mua</label>
                <input
                  type="date"
                  id="purchaseDate"
                  name="purchaseDate"
                  value={device.purchaseDate || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="warrantyEnd" className="form-label">Ngày hết hạn bảo hành</label>
                <input
                  type="date"
                  id="warrantyEnd"
                  name="warrantyEnd"
                  value={device.warrantyEnd || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="warrantyPlace" className="form-label">Địa chỉ bảo hành</label>
                <input
                  type="text"
                  id="warrantyPlace"
                  name="warrantyPlace"
                  value={device.warrantyPlace || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4">Hình ảnh & Ghi chú</h2>
              
              <div className="mb-4">
                <label className="form-label">Ảnh thiết bị</label>
                <div className="mt-1">
                  {deviceImage ? (
                    <div className="mb-2 relative h-40 w-full overflow-hidden rounded-md">
                      <Image 
                        src={deviceImage}
                        alt={device.name}
                        className="object-cover"
                        fill
                        unoptimized={true}
                      />
                    </div>
                  ) : (
                    <div className="mb-2 h-40 w-full bg-gray-100 flex items-center justify-center rounded-md">
                      <p className="text-gray-400">Chưa có ảnh</p>
                    </div>
                  )}
                  
                  <label className="btn-secondary inline-block cursor-pointer">
                    Chọn ảnh thiết bị
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'device')}
                      disabled={uploadingImage || isSubmitting}
                    />
                  </label>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="form-label">Ảnh vị trí cất</label>
                <div className="mt-1">
                  {locationImage ? (
                    <div className="mb-2 relative h-40 w-full overflow-hidden rounded-md">
                      <Image 
                        src={locationImage}
                        alt="Vị trí cất"
                        className="object-cover"
                        fill
                        unoptimized={true}
                      />
                    </div>
                  ) : (
                    <div className="mb-2 h-40 w-full bg-gray-100 flex items-center justify-center rounded-md">
                      <p className="text-gray-400">Chưa có ảnh</p>
                    </div>
                  )}
                  
                  <label className="btn-secondary inline-block cursor-pointer">
                    Chọn ảnh vị trí
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'location')}
                      disabled={uploadingImage || isSubmitting}
                    />
                  </label>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="notes" className="form-label">Ghi chú</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={device.notes || ''}
                  onChange={handleInputChange}
                  className="form-input h-32"
                  placeholder="Nhập các ghi chú về thiết bị..."
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}