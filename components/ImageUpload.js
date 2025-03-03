import { useState, useEffect } from 'react';
import Image from 'next/image';

const ImageUpload = ({ onImageUpload, currentImage = null, label = 'Tải Ảnh Lên' }) => {
  const [preview, setPreview] = useState(currentImage);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  
  // Log để debug
  console.log('ImageUpload - currentImage:', currentImage);
  
  // Update preview when currentImage changes
  useEffect(() => {
    setPreview(currentImage);
  }, [currentImage]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn một tệp hình ảnh');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload the image
    const formData = new FormData();
    formData.append('image', file);

    setIsUploading(true);
    setError('');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Lỗi khi tải ảnh lên');
      }

      const data = await response.json();
      onImageUpload(data.imagePath);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error.message || 'Lỗi khi tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="form-label">{label}</label>
      <div className="mt-1 flex items-center">
        {preview && (
          <div className="mr-3 relative h-32 w-32 overflow-hidden rounded-md">
            <Image 
              src={preview.startsWith('data:') ? preview : preview} 
              alt="Preview" 
              className="object-cover h-full w-full"
              width={128}
              height={128}
              unoptimized={true}
            />
          </div>
        )}
        <label className="btn-secondary cursor-pointer">
          {isUploading ? 'Đang Tải...' : 'Chọn Ảnh'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default ImageUpload;