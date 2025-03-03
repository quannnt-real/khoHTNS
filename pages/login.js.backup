import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Thêm trạng thái showPassword

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập không thành công');
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
            Đăng nhập
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
          <div className="rounded-md shadow-sm space-y-3">
            <div>
              <label htmlFor="phone" className="sr-only">Số điện thoại</label>
              <input
                id="phone"
                name="phone"
                type="text"
                required
                className="form-input rounded-t-md"
                placeholder="Số điện thoại"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Mật khẩu</label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'} // Toggle type dựa trên showPassword
                required
                className="form-input rounded-b-md pr-10" // Thêm padding-right để chừa chỗ cho icon
                placeholder="Mật khẩu"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)} // Chuyển đổi trạng thái khi nhấp
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 cursor-pointer hover:text-gray-700"
              >
                <FontAwesomeIcon
                  icon={showPassword ? 'eye' : 'eye-slash'} // Toggle giữa eye và eye-slash
                  className="h-5 w-5"
                />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                Quên mật khẩu?
              </Link>
            </div>
            {/* <div className="text-sm">
              <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Đăng ký tài khoản mới
              </Link>
            </div> */}
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
                <FontAwesomeIcon icon="sign-in-alt" className="h-5 w-5 mr-2" />
              )}
              Đăng nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}