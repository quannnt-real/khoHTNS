import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }

    // Check password length
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    // Validate phone format
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Số điện thoại không hợp lệ');
      return false;
    }

    // Validate email if provided
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Email không hợp lệ');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Remove confirmPassword before sending
      const { confirmPassword, ...registerData } = formData;

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký không thành công');
      }

      // Save token to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to home page with forced reload to update auth state
      window.location.href = '/';
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
            Đăng ký tài khoản
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Quản lý kho thiết bị sự kiện
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

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Họ tên</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="form-input"
                placeholder="Nhập họ tên"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
              <input
                id="phone"
                name="phone"
                type="text"
                required
                className="form-input"
                placeholder="Nhập số điện thoại"
                value={formData.phone}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">Số điện thoại dùng để đăng nhập</p>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (không bắt buộc)</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="Nhập email (không bắt buộc)"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="form-input"
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                value={formData.password}
                onChange={handleChange}
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
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Đã có tài khoản? Đăng nhập
              </Link>
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
                <FontAwesomeIcon icon="user-plus" className="h-5 w-5 mr-2" />
              )}
              Đăng ký
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}