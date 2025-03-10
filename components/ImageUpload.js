import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUpload, faLink, faSpinner, faCheck, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

const ImageUpload = ({ 
  onImageUpload = () => {}, 
  currentImage = null, 
  label = 'Tải Ảnh Lên',
  onImageDelete = null // Thêm prop để xóa ảnh
}) => {
  const [preview, setPreview] = useState(currentImage);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' hoặc 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [isUrlChecking, setIsUrlChecking] = useState(false);
  const [isUrlValid, setIsUrlValid] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (currentImage) {
      setPreview(currentImage);
    }
  }, [currentImage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (imageUrl && uploadMethod === 'url') {
        validateImageUrl(imageUrl);
      }
    }, 500); // Đợi 500ms sau khi người dùng ngừng nhập
    
    return () => clearTimeout(timeoutId);
  }, [imageUrl]);

  async function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    setError('');
    setUploadProgress(0);

    try {
      // Hiển thị preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Kiểm tra file HEIC/HEIF
      if (
        file.type === 'image/heic' || 
        file.type === 'image/heif' || 
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif')
      ) {
        setUploadProgress(10);
        // Dynamic import chỉ khi cần thiết và chỉ ở client-side
        const heic2any = (await import('heic2any')).default;
        setUploadProgress(30);
        
        // Chuyển đổi HEIC sang JPEG
        const jpegBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.85
        });
        
        setUploadProgress(70);
        
        // Tạo File mới từ Blob
        const fileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
        const convertedFile = new File(
          [jpegBlob], 
          fileName,
          { type: 'image/jpeg' }
        );
        
        // Upload file đã chuyển đổi
        await uploadImage(convertedFile);
      } else {
        // Upload file không phải HEIC như bình thường
        await uploadImage(file);
      }
    } catch (err) {
      console.error('Lỗi xử lý file:', err);
      setError(`Không thể xử lý ảnh: ${err.message}`);
      setIsUploading(false);
    }
  }

  async function uploadImage(file) {
    setIsUploading(true);
    setUploadProgress(80);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      setUploadProgress(100);
      
      // Gọi callback sau khi upload thành công
      if (typeof onImageUpload === 'function') {
        onImageUpload(data.imagePath);
      }
      
      return data.imagePath;
    } catch (err) {
      console.error('Lỗi upload:', err);
      setError(err.message || 'Lỗi tải lên ảnh');
      throw err;
    } finally {
      setIsUploading(false);
    }
  }

  // Thêm hàm để validate URL ảnh
  async function validateImageUrl(url) {
    if (!url) return;
    
    setIsUrlChecking(true);
    setIsUrlValid(null);
    setError('');
    
    try {
      // Kiểm tra định dạng URL
      try {
        new URL(url);
      } catch (error) {
        throw new Error('URL không hợp lệ');
      }
      
      // Kiểm tra các định dạng ảnh phổ biến
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
      const hasValidExt = validExtensions.some(ext => url.toLowerCase().endsWith(ext));
      
      if (hasValidExt) {
        setIsUrlValid(true);
        setPreview(url);
        onImageUpload(url);
        return;
      }
      
      // Kiểm tra bằng cách tải ảnh
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          setIsUrlValid(true);
          setPreview(url);
          onImageUpload(url);
          resolve(true);
        };
        img.onerror = () => {
          reject(new Error('URL không phải hình ảnh hoặc không thể truy cập'));
        };
        img.src = url;
        
        setTimeout(() => {
          reject(new Error('Kiểm tra URL hình ảnh quá thời gian'));
        }, 5000);
      });
    } catch (error) {
      console.error('Lỗi kiểm tra URL:', error);
      setError(error.message);
      setIsUrlValid(false);
    } finally {
      setIsUrlChecking(false);
    }
  }

  // Hàm để xóa hình ảnh
  const handleDelete = () => {
    setPreview(null);
    setImageUrl('');
    setIsUrlValid(null);
    setError('');
    
    if (typeof onImageDelete === 'function') {
      onImageDelete();
    }
  };

  // Thêm các hàm xử lý kéo thả
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange({ target: { files: [files[0]] } });
    }
  };

  return (
    <div className="mb-4">
      {/* Tabs để chuyển đổi phương thức upload */}
      <div className="flex border-b mb-3">
        <button
          type="button"
          className={`px-4 py-2 font-medium text-sm focus:outline-none ${
            uploadMethod === 'file'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setUploadMethod('file')}
        >
          <FontAwesomeIcon icon={faUpload} className="mr-2" />
          Tải lên
        </button>
        <button
          type="button"
          className={`px-4 py-2 font-medium text-sm focus:outline-none ${
            uploadMethod === 'url'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setUploadMethod('url')}
        >
          <FontAwesomeIcon icon={faLink} className="mr-2" />
          Từ URL
        </button>
      </div>

      {/* Preview hình ảnh hiện tại */}
      {preview && (
        <div className="mb-3 relative rounded-md overflow-hidden border border-gray-200">
          <div className="relative h-48 w-full md:h-64">
            <Image 
              src={preview} 
              alt="Preview" 
              fill
              className="object-contain"
              unoptimized={true}
            />
            <div className="absolute top-2 right-2 flex space-x-2">
              {/* Nút xóa ảnh */}
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full text-red-500 hover:bg-red-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phương thức Upload File */}
      {uploadMethod === 'file' && (
        <div>
          <div 
            className={`border-2 border-dashed rounded-md ${isDragging ? 'border-blue-500 bg-blue-50' : error ? 'border-red-300' : 'border-gray-300'} p-4 text-center`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <label className="cursor-pointer block p-4">
              <FontAwesomeIcon icon={faUpload} className="text-2xl text-gray-400 mb-2" />
              <div className="text-sm text-gray-600">Click để chọn ảnh hoặc kéo thả file vào đây</div>
              <div className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, HEIC...</div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>

          {isUploading && (
            <div className="upload-progress mt-2">
              <div 
                className="progress-bar"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <span>{uploadProgress > 0 ? 
                (uploadProgress < 100 ? 'Đang xử lý...' : 'Đang tải lên...') : 
                'Chuẩn bị...'}</span>
            </div>
          )}
        </div>
      )}

      {/* Phương thức URL */}
      {uploadMethod === 'url' && (
        <div>
          <div className="relative">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={`w-full form-input rounded-md border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 ${
                isUrlValid === false ? 'border-red-300' : ''
              } ${isUrlChecking ? 'pr-10' : ''}`}
              placeholder="Nhập URL hình ảnh..."
            />
            {isUrlChecking && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FontAwesomeIcon icon={faSpinner} className="text-gray-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Trạng thái URL */}
          {isUrlValid === true && (
            <div className="mt-2 text-sm text-green-600 flex items-center">
              <FontAwesomeIcon icon={faCheck} className="mr-1" />
              URL hợp lệ
            </div>
          )}
          {isUrlValid === false && (
            <div className="mt-2 text-sm text-red-600 flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
              URL không hợp lệ
            </div>
          )}
        </div>
      )}

      {/* Thông báo lỗi */}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      
      <style jsx>{`
        .upload-progress {
          height: 20px;
          width: 100%;
          background-color: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }
        .progress-bar {
          height: 100%;
          background-color: #4CAF50;
          transition: width 0.3s ease;
        }
        .upload-progress span {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default ImageUpload;