/**
 * Trang kiểm tra các chức năng chuyển hướng cơ bản
 */
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function TestRedirect() {
  const router = useRouter();
  const [log, setLog] = useState([]);
  const [target, setTarget] = useState('/');

  // Hàm để thêm log
  const addLog = (message) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Kiểm tra chuyển hướng đến trang chủ
  const testHomeRedirect = () => {
    try {
      addLog('Chuyển hướng đến trang chủ...');
      router.push('/');
      addLog('✅ Đã chuyển hướng thành công');
    } catch (error) {
      addLog(`❌ Lỗi: ${error.message}`);
    }
  };

  // Kiểm tra chuyển hướng với tham số
  const testParamRedirect = () => {
    try {
      const path = `/events/test-${Date.now()}`;
      addLog(`Chuyển hướng đến ${path}...`);
      router.push(path || '/');
      addLog('✅ Đã chuyển hướng thành công');
    } catch (error) {
      addLog(`❌ Lỗi: ${error.message}`);
    }
  };
  
  // Kiểm tra chuyển hướng tùy chỉnh
  const testCustomRedirect = () => {
    try {
      if (!target) {
        addLog('⚠️ Cảnh báo: Đường dẫn trống, không thực hiện chuyển hướng');
        return;
      }
      addLog(`Chuyển hướng đến ${target}...`);
      router.push(target || '/');
      addLog('✅ Đã chuyển hướng thành công');
    } catch (error) {
      addLog(`❌ Lỗi: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <Head>
        <title>Kiểm tra Redirect</title>
      </Head>
      
      <h1>Kiểm tra chức năng redirect</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testHomeRedirect}
          style={{ padding: '8px 16px', marginRight: '10px' }}
        >
          Chuyển hướng đến trang chủ
        </button>
        
        <button 
          onClick={testParamRedirect}
          style={{ padding: '8px 16px', marginRight: '10px' }}
        >
          Chuyển hướng với tham số
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Nhập đường dẫn đích..."
          style={{ padding: '8px', width: '300px', marginRight: '10px' }}
        />
        
        <button 
          onClick={testCustomRedirect}
          style={{ padding: '8px 16px' }}
        >
          Chuyển hướng đến đường dẫn tùy chỉnh
        </button>
      </div>
      
      <div>
        <h3>Nhật ký:</h3>
        <div style={{ 
          border: '1px solid #ccc', 
          padding: '10px',
          height: '300px',
          overflowY: 'auto',
          backgroundColor: '#f5f5f5'
        }}>
          {log.map((entry, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              {entry}
            </div>
          ))}
          {log.length === 0 && (
            <em>Chưa có hoạt động nào.</em>
          )}
        </div>
      </div>
    </div>
  );
}
