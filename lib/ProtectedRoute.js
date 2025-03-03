import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password'];

// Routes that require admin privileges
const adminRoutes = ['/users', '/users/[id]', '/admin'];

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Client-side only code
    if (typeof window === 'undefined') return;
    
    // Don't check until auth loading is complete
    if (loading) return;

    const checkAuth = async () => {
      // Check if we're on a public route
      const isPublicRoute = publicRoutes.includes(router.pathname);
      
      // Handle authentication
      if (!isAuthenticated() && !isPublicRoute) {
        // Redirect to login if user is not authenticated and trying to access protected route
        console.log('Not authenticated, redirecting to login');
        if (router) {
          await router.replace('/login');
        }
      } else if (isAuthenticated() && isPublicRoute) {
        // Redirect to dashboard if user is authenticated but trying to access login/register
        console.log('Already authenticated, redirecting to dashboard');
        if (router) {
          await router.replace('/');
        }
      } else {
        // Handle admin routes
        const isAdminRoute = adminRoutes.some(route => {
          // Use simple logic for dynamic routes
          if (route.includes('[')) {
            const baseRoute = route.split('/').slice(0, -1).join('/');
            return router.pathname.startsWith(baseRoute);
          }
          return route === router.pathname;
        });

        if (isAdminRoute && !isAdmin()) {
          // Redirect to dashboard if user is not admin but trying to access admin route
          console.log('Not admin, redirecting to dashboard');
          if (router) {
            await router.replace('/');
          }
        }
      }
      
      setIsChecking(false);
    };

    checkAuth();
  }, [router.pathname, isAuthenticated, isAdmin, loading]);

  // Show loading spinner while checking authentication
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon="circle-notch" spin className="h-8 w-8 text-indigo-500 mb-4" />
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}