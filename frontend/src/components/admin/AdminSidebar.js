import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FaTachometerAlt,
    FaUsers,
    FaCalendarCheck,
    FaExclamationTriangle,
    FaFileAlt,
    FaDollarSign,
    FaUserTie,
    FaCreditCard,
    FaTicketAlt
} from 'react-icons/fa';

const AdminSidebar = () => {
    const [isOpen, setIsOpen] = useState(true);
    const location = useLocation();
    const { user } = useAuth();

    const menuItems = [
        {
            name: 'Dashboard',
            path: '/admin',
            icon: FaTachometerAlt,
            description: 'Thống kê tổng quan'
        },
        {
            name: 'Người dùng',
            path: '/admin/users',
            icon: FaUsers,
            description: 'Quản lý người dùng'
        },
        {
            name: 'Sự kiện',
            path: '/admin/events',
            icon: FaCalendarCheck,
            description: 'Duyệt và quản lý sự kiện'
        },
        {
            name: 'Thanh toán POS',
            path: '/admin/pos-confirmation',
            icon: FaCreditCard,
            description: 'Xác nhận thanh toán POS'
        },
        {
            name: 'Khiếu nại',
            path: '/admin/complaints',
            icon: FaExclamationTriangle,
            description: 'Xử lý khiếu nại'
        },
        {
            name: 'Bài viết',
            path: '/admin/posts',
            icon: FaFileAlt,
            description: 'Quản lý tất cả bài đăng'
        },
        {
            name: 'Doanh thu',
            path: '/admin/revenue',
            icon: FaDollarSign,
            description: 'Báo cáo doanh thu'
        },
        {
            name: 'Yêu cầu Owner',
            path: '/admin/owner-requests',
            icon: FaUserTie,
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
        <div className={`bg-gray-800 text-white transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
            <div className="flex items-center justify-between h-16 px-4 bg-gray-900">
                <div className={`flex items-center ${isOpen ? 'space-x-3' : 'justify-center'}`}>
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">A</span>
                    </div>
                    {isOpen && <h1 className="text-white font-bold text-xl">Admin</h1>}
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-gray-300 hover:text-white"
                >
                    {isOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    )}
                </button>
            </div>

            {isOpen && (
                <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                                {user?.username?.charAt(0).toUpperCase() || 'A'}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{user?.username}</p>
                            <p className="text-xs text-gray-400">{user?.email}</p>
                        </div>
                    </div>
                </div>
            )}

            <nav className="mt-4">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center px-4 py-3 text-sm ${
                            isActive(item.path)
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                    >
                        <item.icon className={`h-5 w-5 ${isOpen ? 'mr-3' : 'mx-auto'}`} />
                        {isOpen && (
                            <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-gray-400">{item.description}</div>
                            </div>
                        )}
                    </Link>
                ))}
            </nav>
        </div>
    );
};

export default AdminSidebar; 