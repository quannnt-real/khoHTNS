import { useState, useEffect } from 'react';

export default function TestGoogleEmail() {
  const [email, setEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [status, setStatus] = useState({ loading: false, message: '', success: null });

  // Kiểm tra trạng thái xác thực
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/test-email-google');
        setIsAuthenticated(response.ok);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      }
    }
    
    checkAuth();
  }, []);

  const handleAuthenticate = () => {
    window.location.href = '/api/auth/google';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, message: 'Đang gửi email...', success: null });

    try {
      const response = await fetch('/api/test-email-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ 
          loading: false, 
          message: `Email đã được gửi thành công qua Google API! MessageID: ${data.messageId}`, 
          success: true 
        });
      } else {
        setStatus({ 
          loading: false, 
          message: `Lỗi: ${data.message || 'Không thể gửi email'}`, 
          success: false 
        });
        
        if (data.message?.includes('Not authenticated')) {
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      setStatus({ 
        loading: false, 
        message: `Lỗi: ${error.message}`, 
        success: false 
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Test Gửi Email qua Google API</h1>
      
      {!isAuthenticated ? (
        <div className="text-center">
          <p className="mb-4">Bạn cần xác thực với Google trước khi gửi email.</p>
          <button 
            onClick={handleAuthenticate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Xác thực với Google
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-1">Email đích:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded"
              placeholder="nhập-email@example.com"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={status.loading}
          >
            {status.loading ? 'Đang gửi...' : 'Gửi email test'}
          </button>
        </form>
      )}

      {status.message && (
        <div className={`mt-4 p-3 rounded ${
          status.success ? 'bg-green-100 text-green-800' : 
          status.success === false ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {status.message}
        </div>
      )}
    </div>
  );
}