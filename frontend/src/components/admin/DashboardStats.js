import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const DashboardStats = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalEvents: 0,
        totalRevenue: 0,
        pendingComplaints: 0,
        activeEvents: 0,
        bannedUsers: 0,
        monthlyRevenue: 0,
        pendingEvents: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await adminAPI.getDashboardStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const statCards = [
        {
            title: 'Tổng Users',
            value: formatNumber(stats.totalUsers),
            icon: '👥',
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            change: '+12%',
            changeType: 'increase'
        },
        {
            title: 'Tổng Events',
            value: formatNumber(stats.totalEvents),
            icon: '🎫',
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600',
            change: '+8%',
            changeType: 'increase'
        },
        {
            title: 'Doanh thu tháng',
            value: formatCurrency(stats.monthlyRevenue),
            icon: '💰',
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600',
            change: '+25%',
            changeType: 'increase'
        },
        {
            title: 'Khiếu nại chờ',
            value: formatNumber(stats.pendingComplaints),
            icon: '📝',
            color: 'from-yellow-500 to-yellow-600',
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-600',
            change: '-5%',
            changeType: 'decrease'
        },
        {
            title: 'Events đang hoạt động',
            value: formatNumber(stats.activeEvents),
            icon: '🎯',
            color: 'from-indigo-500 to-indigo-600',
            bgColor: 'bg-indigo-50',
            textColor: 'text-indigo-600',
            change: '+15%',
            changeType: 'increase'
        },
        {
            title: 'Users bị ban',
            value: formatNumber(stats.bannedUsers),
            icon: '🚫',
            color: 'from-red-500 to-red-600',
            bgColor: 'bg-red-50',
            textColor: 'text-red-600',
            change: '+3%',
            changeType: 'increase'
        },
        {
            title: 'Tổng doanh thu',
            value: formatCurrency(stats.totalRevenue),
            icon: '💎',
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-50',
            textColor: 'text-emerald-600',
            change: '+18%',
            changeType: 'increase'
        },
        {
            title: 'Events chờ duyệt',
            value: formatNumber(stats.pendingEvents),
            icon: '⏳',
            color: 'from-orange-500 to-orange-600',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-600',
            change: '+2%',
            changeType: 'increase'
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                            <div className="w-16 h-6 bg-gray-200 rounded"></div>
                        </div>
                        <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
                        <div className="w-24 h-4 bg-gray-200 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Thống kê tổng quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                    >
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                    <span className="text-2xl">{card.icon}</span>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    card.changeType === 'increase' 
                                        ? 'bg-green-100 text-green-600' 
                                        : 'bg-red-100 text-red-600'
                                }`}>
                                    {card.changeType === 'increase' ? '↗️' : '↘️'} {card.change}
                                </div>
                            </div>

                            {/* Value */}
                            <div className="mb-2">
                                <h3 className="text-2xl font-bold text-gray-900 group-hover:scale-105 transition-transform duration-300">
                                    {card.value}
                                </h3>
                            </div>

                            {/* Title */}
                            <p className={`text-sm font-medium ${card.textColor}`}>
                                {card.title}
                            </p>

                            {/* Progress bar */}
                            <div className="mt-4">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className={`bg-gradient-to-r ${card.color} h-2 rounded-full transition-all duration-1000 ease-out`}
                                        style={{ width: `${Math.min(100, (index + 1) * 12.5)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Hover effect overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300`}></div>
                    </div>
                ))}
            </div>

            {/* Additional insights */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Hiệu suất hệ thống</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Tỷ lệ events được duyệt</span>
                            <span className="text-sm font-medium text-green-600">94%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Độ hài lòng người dùng</span>
                            <span className="text-sm font-medium text-blue-600">87%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Thời gian phản hồi trung bình</span>
                            <span className="text-sm font-medium text-purple-600">2.3s</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{ width: '76%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Thống kê nhanh</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">Users online</span>
                            <span className="text-sm font-bold text-blue-600">1,234</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">Tickets bán hôm nay</span>
                            <span className="text-sm font-bold text-green-600">456</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">Doanh thu hôm nay</span>
                            <span className="text-sm font-bold text-purple-600">12.5M</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">Cần xử lý</span>
                            <span className="text-sm font-bold text-yellow-600">8</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardStats; 