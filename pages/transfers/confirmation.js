import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function TransferConfirmation() {
  const router = useRouter();
  const { status, id } = router.query;
  const [transferDetails, setTransferDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (!router.isReady) return;
    
    // If status is error, no need to fetch transfer details
    if (status === 'error') {
      setLoading(false);
      return;
    }
    
    // If there's an ID, fetch the transfer details
    if (id) {
      fetchTransferDetails();
    } else {
      setLoading(false);
    }
  }, [router.isReady, status, id]);
  
  const fetchTransferDetails = async () => {
    try {
      const response = await fetch(`/api/transfers/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transfer details');
      }
      
      const data = await response.json();
      setTransferDetails(data);
    } catch (err) {
      console.error('Error fetching transfer details:', err);
      setError('Không thể tải thông tin yêu cầu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-700">Đang tải...</h2>
        </div>
      </div>
    );
  }
  
  // Handle error status
  if (status === 'error' || error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon="times" className="text-red-500 h-8 w-8" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Đã xảy ra lỗi</h1>
          <p className="text-gray-600 mb-6">
            {error || 'Không thể xử lý yêu cầu của bạn. Vui lòng thử lại sau.'}
          </p>
          
          <Link href="/" className="btn">
            Trở về trang chủ
          </Link>
        </div>
      </div>
    );
  }
  
  // Handle accepted status
  if (status === 'accepted') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon="check" className="text-green-500 h-8 w-8" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Yêu cầu được chấp nhận</h1>
          <p className="text-gray-600 mb-6">
            Bạn đã chấp nhận yêu cầu chuyển/mượn thiết bị thành công.
          </p>
          
          {transferDetails && (
            <div className="bg-blue-50 p-4 rounded-md mb-6 text-left">
              <div className="flex items-center mb-2">
                <FontAwesomeIcon icon="info-circle" className="text-blue-500 h-4 w-4 mr-2" />
                <h3 className="font-medium text-blue-700">Thông tin thiết bị</h3>
              </div>
              
              <div className="pl-6 space-y-1">
                <p>
                  <span className="font-medium">Thiết bị:</span> {transferDetails.device?.name || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Người yêu cầu:</span> {transferDetails.user?.name || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Trạng thái:</span> Đã chấp nhận
                </p>
              </div>
            </div>
          )}
          
          <Link href="/" className="btn">
            Đi đến trang chủ
          </Link>
        </div>
      </div>
    );
  }
  
  // Handle rejected status
  if (status === 'rejected') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon="times" className="text-orange-500 h-8 w-8" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Yêu cầu đã bị từ chối</h1>
          <p className="text-gray-600 mb-6">
            Bạn đã từ chối yêu cầu chuyển/mượn thiết bị.
          </p>
          
          {transferDetails && (
            <div className="bg-blue-50 p-4 rounded-md mb-6 text-left">
              <div className="flex items-center mb-2">
                <FontAwesomeIcon icon="info-circle" className="text-blue-500 h-4 w-4 mr-2" />
                <h3 className="font-medium text-blue-700">Thông tin thiết bị</h3>
              </div>
              
              <div className="pl-6 space-y-1">
                <p>
                  <span className="font-medium">Thiết bị:</span> {transferDetails.device?.name || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Người yêu cầu:</span> {transferDetails.user?.name || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Trạng thái:</span> Đã từ chối
                </p>
              </div>
            </div>
          )}
          
          <Link href="/" className="btn">
            Đi đến trang chủ
          </Link>
        </div>
      </div>
    );
  }
  
  // Default case - should not happen
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Trạng thái không hợp lệ</h1>
        <p className="text-gray-600 mb-6">
          Trạng thái yêu cầu không hợp lệ hoặc không được cung cấp.
        </p>
        
        <Link href="/" className="btn">
          Trở về trang chủ
        </Link>
      </div>
    </div>
  );
}