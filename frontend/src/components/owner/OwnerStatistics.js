import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaChartLine, 
  FaCalendarAlt, 
  FaUsers, 
  FaTicketAlt, 
  FaMoneyBillWave,
  FaEye,
  FaHeart,
  FaComments,
  FaArrowUp,
  FaArrowDown,
  FaCalendar,
  FaClock,
  FaSignOutAlt,
  FaHome,
  FaUser,
  FaBell
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import api from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const OwnerStatistics = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalEvents: 0,
    totalTickets: 0,
    totalViews: 0,
    revenueGrowth: 0,
    eventsGrowth: 0,
    ticketsGrowth: 0,
    viewsGrowth: 0,
    topEvents: [],
    monthlyRevenue: [],
    months: [],
    categoryLabels: [],
    categoryData: [],
    uniqueCustomers: 0,
    newCustomers: 0,
    recentActivities: []
  });
  
  // State cho modal người mua vé
  const [showBuyersModal, setShowBuyersModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/owner/statistics?timeRange=${timeRange}`);
        
        if (response.data.success) {
          setStats(response.data.data);
        } else {
          console.error('Error fetching statistics:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [timeRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - new Date(date)) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleEventClick = (event) => {
    console.log('🎭 Clicked event:', event);
    
    // Try multiple ways to get event ID
    const eventId = event?.id || event?._id || event?.eventId;
    
    if (eventId) {
      console.log('🎭 Navigating to event detail:', `/events/${eventId}`);
      navigate(`/events/${eventId}`);
    } else {
      console.log('🎭 No event ID found, falling back to search:', event?.name);
      // Fallback: tìm kiếm event theo tên
      navigate(`/events?search=${encodeURIComponent(event.name)}`);
    }
  };

  const handleTicketsClick = (event) => {
    setSelectedEvent(event);
    setShowBuyersModal(true);
  };

  const handleCloseModal = () => {
    setShowBuyersModal(false);
    setSelectedEvent(null);
  };

  // Chart data for Revenue by Month
  const revenueChartData = {
    labels: stats.months,
    datasets: [
      {
        label: 'Doanh thu (triệu VNĐ)',
        data: stats.monthlyRevenue,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + 'M';
          }
        }
      },
    },
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FaChartLine className="text-white text-sm" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">EventTicketPortal</h1>
                <p className="text-sm text-gray-500">Thống kê tổng quan</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoHome}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <FaHome className="mr-2" />
                Trang chủ
              </button>

              {/* User Menu */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <FaBell className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <FaUser className="text-white text-sm" />
                    </div>
                    <div className="hidden md:block">
                      <div className="text-sm font-medium text-gray-900">{user?.username || 'User'}</div>
                      <div className="text-xs text-gray-500">{user?.email || 'user@example.com'}</div>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <FaSignOutAlt className="mr-2" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thống kê tổng quan</h1>
          <p className="text-gray-600">Theo dõi hiệu suất và doanh thu của các sự kiện</p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Thời gian:</span>
            <div className="flex bg-white rounded-lg shadow-sm">
              {[
                { key: 'month', label: 'Tháng này' },
                { key: 'quarter', label: 'Quý này' },
                { key: 'year', label: 'Năm nay' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTimeRange(key)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    timeRange === key
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
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
                  <span className="text-sm text-green-600">+{stats.revenueGrowth}%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaMoneyBillWave className="text-blue-600 text-xl" />
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
                <p className="text-sm font-medium text-gray-600">Sự kiện đã tổ chức</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalEvents)}</p>
                <div className="flex items-center mt-2">
                  <FaArrowUp className="text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{stats.eventsGrowth}%</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaCalendarAlt className="text-green-600 text-xl" />
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
                  <span className="text-sm text-green-600">+{stats.ticketsGrowth || 0}%</span>
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
                <p className="text-sm font-medium text-gray-600">Lượt xem</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalViews)}</p>
                <div className="flex items-center mt-2">
                  <FaArrowUp className="text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{stats.viewsGrowth || 0}%</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FaEye className="text-orange-600 text-xl" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Top Events Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top sự kiện được quan tâm</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên sự kiện
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doanh thu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vé đã bán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lượt xem
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.topEvents.map((event, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FaCalendar className="text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div 
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                            onClick={() => handleEventClick(event)}
                            title="Click để xem chi tiết sự kiện"
                          >
                            {event.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(event.revenue)}
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                       <div 
                         className="cursor-pointer hover:text-blue-600 transition-colors"
                         onClick={() => handleTicketsClick(event)}
                         title="Click để xem danh sách người mua vé"
                       >
                         {formatNumber(event.tickets)}
                       </div>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(event.views)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu theo tháng</h3>
            <div className="h-64">
              <Line data={revenueChartData} options={revenueChartOptions} />
            </div>
          </motion.div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
            <div className="space-y-3">
              {stats.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'event_created' ? 'bg-green-500' :
                    activity.type === 'ticket_sold' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`}></div>
                  <span className="text-sm text-gray-600">{activity.message}</span>
                  <span className="text-xs text-gray-400 ml-auto">{formatTimeAgo(activity.time)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê khách hàng</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Khách hàng mới</span>
                <span className="text-sm font-medium text-gray-900">+{stats.newCustomers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tổng khách hàng</span>
                <span className="text-sm font-medium text-gray-900">{stats.uniqueCustomers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tỷ lệ giữ chân</span>
                <span className="text-sm font-medium text-green-600">78%</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hiệu suất</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tỷ lệ chuyển đổi</span>
                <span className="text-sm font-medium text-green-600">12.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Thời gian trung bình</span>
                <span className="text-sm font-medium text-gray-900">3.2 phút</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Đánh giá trung bình</span>
                <span className="text-sm font-medium text-yellow-600">4.6/5</span>
              </div>
            </div>
          </motion.div>
                 </div>
       </main>

              {/* Modal Danh sách người mua vé */}
       {showBuyersModal && selectedEvent && (
         <motion.div 
           className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
           onClick={handleCloseModal}
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
         >
           <motion.div 
             className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-hidden"
             onClick={(e) => e.stopPropagation()}
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0.9, opacity: 0 }}
             transition={{ duration: 0.2 }}
           >
               {/* Header */}
               <div className="px-6 py-4 border-b border-gray-200">
                 <div className="flex items-center justify-between">
                   <h3 className="text-lg font-semibold text-gray-900">
                     Những người đã mua vé
                   </h3>
                   <button
                     onClick={handleCloseModal}
                     className="text-gray-400 hover:text-gray-600 transition-colors"
                   >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
                                <div className="flex items-center mt-2">
                   <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                     <FaCalendar className="text-blue-600 text-xs" />
                   </div>
                   <p className="text-sm text-gray-600">
                     {selectedEvent.name} • {formatNumber(selectedEvent.tickets)} vé tổng
                   </p>
                 </div>
             </div>

             {/* Content */}
             <div className="px-6 py-4 overflow-y-auto max-h-64">
               {selectedEvent.buyers && selectedEvent.buyers.length > 0 ? (
                 <div className="space-y-3">
                   {selectedEvent.buyers.map((buyer, idx) => (
                     <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                                <div className="flex items-center space-x-3">
                           <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                             <FaUser className="text-blue-600 text-sm" />
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-medium text-gray-900 truncate">{buyer.name}</p>
                             <p className="text-xs text-gray-500 truncate">@{buyer.name.toLowerCase().replace(/\s+/g, '')}</p>
                           </div>
                         </div>
                       <div className="text-right">
                         <p className="text-sm font-semibold text-blue-600">{buyer.tickets} vé</p>
                       </div>
                     </div>
                   ))}
                 </div>
                                ) : (
                   <div className="text-center py-8">
                     <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                       <FaTicketAlt className="text-gray-400 text-xl" />
                     </div>
                     <p className="text-gray-500 text-sm font-medium mb-1">Chưa có người mua vé</p>
                     <p className="text-gray-400 text-xs">Sự kiện này chưa có người đặt vé</p>
                   </div>
                 )}
             </div>

             {/* Footer */}
             <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-600">Tổng người mua:</span>
                 <span className="font-medium text-blue-600">{selectedEvent.buyers?.length || 0}</span>
               </div>
             </div>
           </motion.div>
         </motion.div>
       )}
     </div>
   );
 };

export default OwnerStatistics; 