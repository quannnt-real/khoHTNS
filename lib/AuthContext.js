import { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on initial load
  useEffect(() => {
    const loadUserFromLocalStorage = () => {
      try {
        // Only run on client side
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }
        
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromLocalStorage();
  }, []);

  // Login function
  const login = async (credentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Đăng nhập không thành công');
    }

    const data = await response.json();
    
    // Save to localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Update state
    setUser(data.user);
    
    return data;
  };

  // Register function
  const register = async (userData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Đăng ký không thành công');
    }

    const data = await response.json();
    
    // Save to localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Update state
    setUser(data.user);
    
    return data;
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear state
    setUser(null);
    
    // Redirect to login
    if (router) {
      router.push('/login');
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Check if user has admin role
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Get auth header for API requests
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Context value
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin,
    getAuthHeader
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}