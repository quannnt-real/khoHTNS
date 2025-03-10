import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCamera, faMapMarkerAlt, faInfoCircle, faTrashAlt, faSave, 
  faTimes, faLink, faUpload, faExclamationTriangle, 
  faCheckCircle, faSearch
} from '@fortawesome/free-solid-svg-icons';
import ImageUpload from './ImageUpload';

export default function DeviceForm({
  formData,
  isSubmitting,
  error,
  showTooltip,
  setShowTooltip,
  imagePreview,
  handleChange,
  handleDeleteImage,
  handleSubmit,
  handleImageUpload,
  mode = 'create'
}) {
  const title = mode === 'create' ? 'Thêm Thiết Bị Mới' : 'Chỉnh Sửa Thiết Bị';
  const submitText = mode === 'create' ? 'Lưu thiết bị' : 'Cập nhật thiết bị';
  
  return (
    <div className="pb-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-sm animate-fade-in">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Cột trái: Thông tin cơ bản */}
              <div className="lg:col-span-3 space-y-6">
                <div className="border-b pb-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Thông tin cơ bản</h2>
                  <p className="text-sm text-gray-500">Nhập thông tin chi tiết về thiết bị</p>
                </div>
                
                <div className="space-y-5">
                  {/* Tên thiết bị */}
                  <div className="form-group">
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="name" className="form-label font-medium">
                        Tên Thiết Bị <span className="text-red-500">*</span>
                      </label>
                      <div className="text-xs text-gray-500">Bắt buộc</div>
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                      placeholder="Nhập tên thiết bị..."
                      required
                    />
                  </div>
                  
                  {/* Grid 2 columns for dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ngày mua */}
                    <div className="form-group">
                      <label htmlFor="purchaseDate" className="form-label font-medium mb-1">Ngày Mua</label>
                      <div className="relative">
                        <input
                          type="date"
                          id="purchaseDate"
                          name="purchaseDate"
                          value={formData.purchaseDate}
                          onChange={handleChange}
                          className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                        />
                        {formData.purchaseDate && (
                          <div className="absolute right-2 top-2 text-xs text-gray-400">
                            {new Date(formData.purchaseDate).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Ngày hết hạn bảo hành */}
                    <div className="form-group">
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="warrantyEnd" className="form-label font-medium">
                          Ngày Hết Hạn Bảo Hành
                        </label>
                        <div 
                          className="text-xs text-blue-600 cursor-help"
                          onMouseEnter={() => setShowTooltip('warranty')}
                          onMouseLeave={() => setShowTooltip(null)}
                          onClick={() => setShowTooltip(showTooltip === 'warranty' ? null : 'warranty')}
                        >
                          <FontAwesomeIcon icon={faInfoCircle} /> Trợ giúp
                        </div>
                      </div>
                      {showTooltip === 'warranty' && (
                        <div className="p-2 mb-2 text-xs bg-blue-50 text-blue-700 rounded">
                          Ngày hết hạn bảo hành sẽ được dùng để tính thời gian còn bảo hành của thiết bị
                        </div>
                      )}
                      <input
                        type="date"
                        id="warrantyEnd"
                        name="warrantyEnd"
                        value={formData.warrantyEnd}
                        onChange={handleChange}
                        className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                  
                  {/* Nơi bảo hành */}
                  <div className="form-group">
                    <label htmlFor="warrantyPlace" className="form-label font-medium mb-1">Nơi Bảo Hành</label>
                    <input
                      type="text"
                      id="warrantyPlace"
                      name="warrantyPlace"
                      value={formData.warrantyPlace}
                      onChange={handleChange}
                      className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                      placeholder="Địa chỉ hoặc tên cửa hàng bảo hành..."
                    />
                  </div>
                  
                  {/* Ghi chú */}
                  <div className="form-group">
                    <label htmlFor="notes" className="form-label font-medium mb-1">Ghi Chú</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className="form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 h-32 resize-y"
                      placeholder="Thông tin thêm về thiết bị..."
                      rows="3"
                    ></textarea>
                  </div>
                </div>
              </div>
              
              {/* Cột phải: Hình ảnh */}
              <div className="lg:col-span-2 space-y-6">
                {/* Thay thế ImageSection bằng ImageUpload */}
                <div>
                  <div className="flex items-center mb-3">
                    <FontAwesomeIcon icon={faCamera} className="mr-2 text-blue-500" />
                    <label className="form-label font-medium">Ảnh thiết bị</label>
                  </div>
                  <ImageUpload 
                    currentImage={imagePreview.device}
                    onImageUpload={(imagePath) => handleImageUpload('image')(imagePath)}
                    onImageDelete={() => handleDeleteImage('image')}
                    label="Ảnh thiết bị"
                  />
                </div>
                
                <div>
                  <div className="flex items-center mb-3">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-blue-500" />
                    <label className="form-label font-medium">Vị trí lưu trữ</label>
                  </div>
                  <ImageUpload 
                    currentImage={imagePreview.location}
                    onImageUpload={(imagePath) => handleImageUpload('locationImage')(imagePath)}
                    onImageDelete={() => handleDeleteImage('locationImage')}
                    label="Vị trí lưu trữ"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    Tải lên hình ảnh vị trí để dễ dàng tìm thiết bị sau này
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer / Action buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
            <Link href="/" className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors inline-flex items-center">
              <FontAwesomeIcon icon={faTimes} className="mr-2" />
              <span>Hủy bỏ</span>
            </Link>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
              disabled={isSubmitting}
            >
              <FontAwesomeIcon icon={faSave} className="mr-2" />
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang lưu...
                </span>
              ) : (
                <span>{submitText}</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}