import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaTicketAlt,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaClock as FaPending,
  FaTimesCircle
} from 'react-icons/fa';

const OwnerEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Giả lập API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setEvents([
          {
            id: 1,
            name: 'Concert Rock Night',
            status: 'approved',
            date: '2024-01-15',
            time: '19:00',
            venue: 'Nhà hát Lớn Hà Nội',
            tickets: 450,
            totalTickets: 500,
            views: 3200,
            revenue: 4500000
          },
          {
            id: 2,
            name: 'Jazz Festival 2024',
            status: 'approved',
            date: '2024-01-20',
            time: '20:00',
            venue: 'Trung tâm Hội nghị Quốc gia',
            tickets: 380,
            totalTickets: 400,
            views: 2800,
            revenue: 3800000
          },
          {
            id: 3,
            name: 'Classical Music Gala',
            status: 'pending',
            date: '2024-02-10',
            time: '18:30',
            venue: 'Nhà hát Opera Hà Nội',
            tickets: 0,
            totalTickets: 350,
            views: 1200,
            revenue: 0
          },
          {
            id: 4,
            name: 'Pop Music Show',
            status: 'approved',
            date: '2024-01-25',
            time: '19:30',
            venue: 'Sân vận động Mỹ Đình',
            tickets: 280,
            totalTickets: 300,
            views: 2100,
            revenue: 2800000
          }
        ]);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FaCheckCircle className="text-green-500" />;
      case 'pending':
        return <FaPending className="text-yellow-500" />;
      case 'rejected':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Đã phê duyệt';
      case 'pending':
        return 'Chờ phê duyệt';
      case 'rejected':
        return 'Từ chối';
      default:
        return 'Không xác định';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sự kiện của tôi</h1>
          <p className="text-gray-600">Quản lý và theo dõi các sự kiện bạn đã tạo</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng sự kiện</p>
                <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaCalendarAlt className="text-blue-600 text-xl" />
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
                <p className="text-sm font-medium text-gray-600">Đã phê duyệt</p>
                <p className="text-2xl font-bold text-gray-900">
                  {events.filter(e => e.status === 'approved').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaCheckCircle className="text-green-600 text-xl" />
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
                <p className="text-sm font-medium text-gray-600">Chờ phê duyệt</p>
                <p className="text-2xl font-bold text-gray-900">
                  {events.filter(e => e.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FaPending className="text-yellow-600 text-xl" />
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
                <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(events.reduce((sum, e) => sum + e.revenue, 0))}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaTicketAlt className="text-purple-600 text-xl" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Events List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách sự kiện</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sự kiện
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian & Địa điểm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vé bán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doanh thu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FaCalendarAlt className="text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{event.name}</div>
                          <div className="text-sm text-gray-500">{formatNumber(event.views)} lượt xem</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <FaClock className="text-gray-400 mr-1" />
                          {event.date} - {event.time}
                        </div>
                        <div className="flex items-center mt-1">
                          <FaMapMarkerAlt className="text-gray-400 mr-1" />
                          {event.venue}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(event.status)}
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                          {getStatusText(event.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <FaTicketAlt className="text-gray-400 mr-1" />
                        {formatNumber(event.tickets)}/{formatNumber(event.totalTickets)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round((event.tickets / event.totalTickets) * 100)}% đã bán
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(event.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <FaEdit />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
);
};

export default OwnerEvents; 