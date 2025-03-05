import '../styles/globals.css';
import '../lib/fontawesome';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { AuthProvider } from '../lib/AuthContext';
import ProtectedRoute from '../lib/ProtectedRoute';
import { useRouter } from 'next/router';
import { SessionProvider } from 'next-auth/react';
import { NotificationProvider } from '../components/NotificationProvider';

// Prevent Font Awesome icons from flashing large icons before CSS loads
config.autoAddCss = false;

// List of routes that don't use the default layout
const noLayoutRoutes = ['/login', '/register', '/forgot-password'];

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulating initial load
    setIsLoading(false);
  }, []);

  // Check if current route should use layout
  const useLayout = !noLayoutRoutes.includes(router.pathname);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Đang tải...</h2>
          <p className="text-gray-500">Đang chuẩn bị ứng dụng Quản lý kho thiết bị</p>
        </div>
      </div>
    );
  }

  return (
    <SessionProvider session={session}>
      <AuthProvider>
        <NotificationProvider>
          <ProtectedRoute>
            {useLayout ? (
              <Layout>
                <Component {...pageProps} />
              </Layout>
            ) : (
              <Component {...pageProps} />
            )}
          </ProtectedRoute>
        </NotificationProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

export default MyApp;