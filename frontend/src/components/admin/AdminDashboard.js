import React from 'react';
import DashboardStats from './DashboardStats';

const AdminDashboard = () => {
    const quickActions = [
        {
            title: 'Quản lý Users',
            description: 'Xem và quản lý tài khoản người dùng',
            icon: '👥',
            color: 'from-blue-500 to-blue-600',
            link: '/admin/users'
        },
        {
            title: 'Duyệt Events',
            description: 'Phê duyệt sự kiện mới',
            icon: '🎫',
            color: 'from-green-500 to-green-600',
            link: '/admin/events'
        },
        {
            title: 'Duyệt chủ sự kiện',
            description: 'Phê duyệt yêu cầu trở thành chủ sự kiện',
            icon: '👨‍💼',
            color: 'from-indigo-500 to-indigo-600',
            link: '/admin/owner-requests'
        },
        {
            title: 'Xử lý Khiếu nại',
            description: 'Giải quyết khiếu nại từ người dùng',
            icon: '📝',
            color: 'from-yellow-500 to-yellow-600',
            link: '/admin/complaints'
        },
        {
            title: 'Báo cáo Doanh thu',
            description: 'Xem thống kê doanh thu',
            icon: '💰',
            color: 'from-purple-500 to-purple-600',
            link: '/admin/revenue'
        }
    ];

    const recentActivities = [
        {
            type: 'user',
            message: 'Người dùng mới đăng ký: john_doe',
            time: '5 phút trước',
            icon: '👤',
            color: 'text-blue-600'
        },
        {
            type: 'event',
            message: 'Sự kiện "Concert Rock Việt Nam 2025" đã được duyệt',
            time: '15 phút trước',
            icon: '✅',
            color: 'text-green-600'
        },
        {
            type: 'owner_request',
            message: 'Yêu cầu trở thành chủ sự kiện từ "Công ty Sự kiện ABC"',
            time: '20 phút trước',
            icon: '👨‍💼',
            color: 'text-indigo-600'
        },
        {
            type: 'complaint',
            message: 'Khiếu nại mới về sự kiện #12345',
            time: '30 phút trước',
            icon: '⚠️',
            color: 'text-yellow-600'
        },
        {
            type: 'revenue',
            message: 'Doanh thu hôm nay: 15,000,000 VNĐ',
            time: '1 giờ trước',
            icon: '💰',
            color: 'text-purple-600'
        }
    ];

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            Chào mừng trở lại! 👋
                        </h1>
                        <p className="text-blue-100 text-lg">
                            Quản lý hệ thống Event Ticketing Platform
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-4xl">🎯</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Stats */}
            <DashboardStats />

            {/* Quick Actions */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Thao tác nhanh</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {quickActions.map((action, index) => (
                        <div
                            key={index}
                            className="group cursor-pointer"
                            onClick={() => window.location.href = action.link}
                        >
                            <div className={`bg-gradient-to-r ${action.color} rounded-xl p-6 text-white transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl`}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-3xl">{action.icon}</span>
                                    <svg className="w-6 h-6 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-lg mb-2">{action.title}</h3>
                                <p className="text-sm opacity-90">{action.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activities & System Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activities */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Hoạt động gần đây</h3>
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Xem tất cả
                        </button>
                    </div>
                    <div className="space-y-4">
                        {recentActivities.map((activity, index) => (
                            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ${activity.color}`}>
                                    <span className="text-sm">{activity.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Trạng thái hệ thống</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-900">Server Status</span>
                            </div>
                            <span className="text-sm text-green-600 font-medium">Online</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-900">Database</span>
                            </div>
                            <span className="text-sm text-green-600 font-medium">Connected</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-900">API Response</span>
                            </div>
                            <span className="text-sm text-blue-600 font-medium">Fast</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-900">Pending Reviews</span>
                            </div>
                            <span className="text-sm text-yellow-600 font-medium">3 items</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard; 