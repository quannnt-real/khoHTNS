import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '../lib/AuthContext';
import NotificationSidebar from './NotificationSidebar';

const Layout = ({ children, title = 'Quản Lý Kho Thiết Bị' }) => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  
  const isActive = (path) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };
  
  const navItems = [
    { path: '/', label: 'Thiết Bị', icon: 'warehouse' },
    { path: '/events', label: 'Sự Kiện', icon: 'calendar-alt' }
  ];
  
  // Add users route for admins
  if (user && user.role === 'admin') {
    navItems.push({ path: '/users', label: 'Người Dùng', icon: 'users' });
  }
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Phần mềm quản lý kho thiết bị cho sự kiện" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      {/* Desktop Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64 bg-indigo-700 text-white">
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4 mb-8">
                <FontAwesomeIcon icon="boxes" className="h-6 w-6 mr-3" />
                <span className="font-bold text-xl">Quản Lý Kho</span>
              </div>
              
              {/* User info on sidebar */}
              {user && (
                <div className="px-4 py-3 border-t border-b border-indigo-800 mb-4">
                  <div className="flex items-center">
                    <div className="rounded-full bg-indigo-600 p-2 mr-3">
                      <FontAwesomeIcon icon="user" className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-indigo-300">
                        {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={logout}
                    className="mt-3 w-full flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md bg-indigo-800 hover:bg-indigo-600 text-white"
                  >
                    <FontAwesomeIcon icon="sign-out-alt" className="h-3 w-3 mr-2" />
                    Đăng xuất
                  </button>
                </div>
              )}
              
              <div className="mt-1 flex-1 flex flex-col">
                <nav className="flex-1 px-2 space-y-1">
                  {navItems.map(item => (
                    <Link 
                      key={item.path} 
                      href={item.path}
                      className={`group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
                       ${isActive(item.path) 
                        ? 'bg-indigo-800 text-white' 
                        : 'text-indigo-100 hover:bg-indigo-600'}`}
                    >
                      <FontAwesomeIcon 
                        icon={item.icon} 
                        className={`mr-3 flex-shrink-0 h-5 w-5
                        ${isActive(item.path) ? 'text-indigo-200' : 'text-indigo-300'}`} 
                      />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2">
            <button 
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-indigo-600 hover:text-white hover:bg-indigo-600 focus:outline-none"
            >
              <span className="sr-only">Mở menu</span>
              <FontAwesomeIcon icon={mobileMenuOpen ? 'times' : 'bars'} className="h-6 w-6" />
            </button>
            
            <div className="text-indigo-700 font-bold">Quản Lý Kho</div>
            
            {/* User menu (mobile) */}
            {user && (
              <div className="relative">
                <button 
                  className="flex items-center text-gray-700 hover:text-indigo-600 focus:outline-none"
                  onClick={toggleUserMenu}
                >
                  <span className="sr-only">Mở menu người dùng</span>
                  <FontAwesomeIcon icon="user-circle" className="h-6 w-6" />
                </button>
                
                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">
                          {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                        </p>
                      </div>
                      <button
                        onClick={logout}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FontAwesomeIcon icon="sign-out-alt" className="mr-2" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-indigo-700 text-white pt-2 pb-3">
              {navItems.map(item => (
                <Link 
                  key={item.path}
                  href={item.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                    isActive(item.path) ? 'bg-indigo-800 text-white' : 'text-indigo-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FontAwesomeIcon icon={item.icon} className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
          
          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
            <div className="py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
          
          <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} Phần Mềm Quản Lý Kho Thiết Bị
              </p>
            </div>
          </footer>
          
          {/* Notification Sidebar */}
          {user && <NotificationSidebar />}
        </div>
      </div>
    </div>
  );
};

export default Layout;