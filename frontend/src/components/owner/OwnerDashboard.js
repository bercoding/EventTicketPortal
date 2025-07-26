import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaMoneyBillWave,
  FaCalendarAlt,
  FaTicketAlt,
  FaComments,
  FaArrowUp,
  FaEye,
  FaUsers
} from 'react-icons/fa';

const OwnerDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeEvents: 0,
    totalTickets: 0,
    newReviews: 0,
    totalViews: 0,
    totalCustomers: 0
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Giả lập API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setStats({
          totalRevenue: 8500000,
          activeEvents: 3,
          totalTickets: 850,
          newReviews: 12,
          totalViews: 12450,
          totalCustomers: 650
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchDashboardStats();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Tổng quan về hoạt động và hiệu suất của bạn</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                <div className="flex items-center mt-2">
                  <FaArrowUp className="text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+15.5%</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaMoneyBillWave className="text-green-600 text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sự kiện đang hoạt động</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.activeEvents)}</p>
                <div className="flex items-center mt-2">
                  <FaArrowUp className="text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+2</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaCalendarAlt className="text-blue-600 text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vé đã bán</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalTickets)}</p>
                <div className="flex items-center mt-2">
                  <FaArrowUp className="text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+8.3%</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaTicketAlt className="text-purple-600 text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Phản hồi mới</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.newReviews)}</p>
                <div className="flex items-center mt-2">
                  <FaArrowUp className="text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+5</span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FaComments className="text-yellow-600 text-xl" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lượt xem tổng</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalViews)}</p>
                <div className="flex items-center mt-2">
                  <FaArrowUp className="text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+12.7%</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FaEye className="text-orange-600 text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Khách hàng</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalCustomers)}</p>
                <div className="flex items-center mt-2">
                  <FaArrowUp className="text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+6.2%</span>
                </div>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <FaUsers className="text-indigo-600 text-xl" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Sự kiện "Concert Rock Night" đã được phê duyệt</span>
                <span className="text-xs text-gray-400 ml-auto">2 giờ trước</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Đã bán 50 vé cho "Jazz Festival 2024"</span>
                <span className="text-xs text-gray-400 ml-auto">4 giờ trước</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Nhận được 3 đánh giá mới</span>
                <span className="text-xs text-gray-400 ml-auto">6 giờ trước</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Tạo sự kiện mới "Classical Music Gala"</span>
                <span className="text-xs text-gray-400 ml-auto">1 ngày trước</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OwnerDashboard; 