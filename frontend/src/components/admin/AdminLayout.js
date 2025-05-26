import React, { useState, useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        {
            name: 'Dashboard',
            path: '/admin',
            icon: '📊',
            description: 'Tổng quan hệ thống'
        },
        {
            name: 'Quản lý Users',
            path: '/admin/users',
            icon: '👥',
            description: 'Quản lý người dùng'
        },
        {
            name: 'Quản lý Events',
            path: '/admin/events',
            icon: '🎫',
            description: 'Duyệt và quản lý sự kiện'
        },
        {
            name: 'Khiếu nại',
            path: '/admin/complaints',
            icon: '📝',
            description: 'Xử lý khiếu nại'
        },
        {
            name: 'Quản lý Posts',
            path: '/admin/posts',
            icon: '📰',
            description: 'Kiểm duyệt bài viết'
        },
        {
            name: 'Báo cáo vi phạm',
            path: '/admin/violations',
            icon: '⚠️',
            description: 'Xử lý vi phạm'
        },
        {
            name: 'Báo cáo doanh thu',
            path: '/admin/revenue',
            icon: '💰',
            description: 'Thống kê doanh thu'
        },
        {
            name: 'Yêu cầu Owner',
            path: '/admin/owner-requests',
            icon: '🏢',
            description: 'Duyệt yêu cầu trở thành owner'
        }
    ];

    const isActive = (path) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                >
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
                </div>
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex lg:flex-shrink-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}>
                <div className="flex flex-col w-72">
                    {/* Sidebar header */}
                    <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-lg">A</span>
                            </div>
                            <h1 className="text-white font-bold text-xl">Admin Panel</h1>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-white hover:text-gray-200 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* User info */}
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 flex-shrink-0">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                                </span>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{user?.username || 'Admin'}</p>
                                <p className="text-sm text-gray-600">{user?.email}</p>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                                    🛡️ Administrator
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                                    isActive(item.path)
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 hover:shadow-md'
                                }`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className="text-2xl mr-4">{item.icon}</span>
                                <div className="flex-1">
                                    <div className="font-semibold">{item.name}</div>
                                    <div className={`text-xs mt-0.5 ${
                                        isActive(item.path) ? 'text-blue-100' : 'text-gray-500'
                                    }`}>
                                        {item.description}
                                    </div>
                                </div>
                                {isActive(item.path) && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* Logout button */}
                    <div className="p-4 border-t border-gray-200 flex-shrink-0">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 hover:text-red-700 transition-all duration-200 group"
                        >
                            <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top header */}
                <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30 flex-shrink-0">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <div className="min-w-0">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                                    {menuItems.find(item => isActive(item.path))?.name || 'Dashboard'}
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-600 truncate">
                                    {menuItems.find(item => isActive(item.path))?.description || 'Tổng quan hệ thống'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-4">
                            {/* Notifications */}
                            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.5a6 6 0 0 1 6 6v2l1.5 3h-15l1.5-3v-2a6 6 0 0 1 6-6z" />
                                </svg>
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            {/* User menu */}
                            <div className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 bg-gray-50 rounded-lg">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-bold text-xs sm:text-sm">
                                        {user?.username?.charAt(0).toUpperCase() || 'A'}
                                    </span>
                                </div>
                                <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:block truncate">
                                    {user?.username}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6 overflow-auto">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout; 