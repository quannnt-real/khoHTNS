import { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Request token, 2: Enter token, 3: Success
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể gửi yêu cầu khôi phục mật khẩu');
      }

      // Save token for development purposes
      // In production, this would be sent via SMS to the user
      if (data.token) {
        console.log('Development token:', data.token);
        setToken(data.token);
      }

      setSuccess('Mã xác nhận đã được gửi đến số điện thoại của bạn');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone,
          token,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể đặt lại mật khẩu');
      }

      setSuccess('Mật khẩu đã được đặt lại thành công');
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Khôi phục mật khẩu
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 1 && 'Nhập số điện thoại để nhận mã xác nhận'}
            {step === 2 && 'Nhập mã xác nhận và mật khẩu mới'}
            {step === 3 && 'Mật khẩu đã được đặt lại thành công'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon="exclamation-circle" className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon="check-circle" className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  {success}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <form className="mt-8 space-y-6" onSubmit={handlePhoneSubmit}>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
              <input
                id="phone"
                name="phone"
                type="text"
                required
                className="form-input"
                placeholder="Nhập số điện thoại đã đăng ký"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isLoading ? (
                  <FontAwesomeIcon icon="circle-notch" spin className="h-5 w-5 mr-2" />
                ) : (
                  <FontAwesomeIcon icon="paper-plane" className="h-5 w-5 mr-2" />
                )}
                Gửi mã xác nhận
              </button>
            </div>
            
            <div className="text-center">
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                <FontAwesomeIcon icon="arrow-left" className="h-4 w-4 mr-1" />
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="mt-8 space-y-6" onSubmit={handleResetSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700">Mã xác nhận</label>
                <input
                  id="token"
                  name="token"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Nhập mã xác nhận đã gửi đến điện thoại"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  className="form-input"
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="form-input"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isLoading ? (
                  <FontAwesomeIcon icon="circle-notch" spin className="h-5 w-5 mr-2" />
                ) : (
                  <FontAwesomeIcon icon="key" className="h-5 w-5 mr-2" />
                )}
                Đặt lại mật khẩu
              </button>
            </div>
            
            <div className="text-center">
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                <FontAwesomeIcon icon="arrow-left" className="h-4 w-4 mr-1" />
                Quay lại
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                <FontAwesomeIcon icon="check" className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-lg font-medium">Mật khẩu đã được đặt lại thành công!</p>
              <p className="text-gray-500 mt-2">Bạn có thể đăng nhập bằng mật khẩu mới.</p>
            </div>
            
            <div className="text-center pt-4">
              <Link href="/login" className="btn">
                <FontAwesomeIcon icon="sign-in-alt" className="mr-2" />
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}