import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Đăng ký các thành phần ChartJS cần thiết
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const RevenueReport = () => {
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState({
    totalRevenue: { totalRevenue: 0, totalTickets: 0, averageTicketPrice: 0 },
    monthlyRevenue: [],
    topEvents: []
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString().split('T')[0], // 3 tháng trước
    endDate: new Date().toISOString().split('T')[0] // Hôm nay
  });
  const [timeFrame, setTimeFrame] = useState('month'); // 'day', 'week', 'month', 'year'

  useEffect(() => {
    fetchRevenue();
  }, [dateRange]);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getRevenue({ 
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      console.log('🧮 Revenue API response:', response.data);
      setRevenue(response.data);
    } catch (error) {
      console.error('Error fetching revenue:', error);
      toast.error('Không thể tải dữ liệu doanh thu: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Định dạng tiền VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  // Tính tổng doanh thu trong ngày hôm nay
  const getTodayRevenue = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayData = revenue.monthlyRevenue.find(item => {
      const itemDate = new Date(item._id.year, item._id.month - 1, 1);
      return itemDate.toISOString().split('T')[0] === today;
    });
    return todayData ? todayData.revenue : 0;
  };

  // Tính tổng doanh thu trong tháng hiện tại
  const getCurrentMonthRevenue = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const currentMonthData = revenue.monthlyRevenue.find(item => 
      item._id.year === currentYear && item._id.month === currentMonth
    );
    
    return currentMonthData ? currentMonthData.revenue : 0;
  };

  // Chuẩn bị dữ liệu biểu đồ doanh thu theo thời gian
  const prepareMonthlyRevenueData = () => {
    if (!revenue.monthlyRevenue || revenue.monthlyRevenue.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Doanh thu',
          data: [],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }]
      };
    }

    // Sắp xếp doanh thu theo thời gian
    const sortedRevenue = [...revenue.monthlyRevenue].sort((a, b) => {
      if (a._id.year !== b._id.year) return a._id.year - b._id.year;
      return a._id.month - b._id.month;
    });

    const labels = sortedRevenue.map(item => `${item._id.month}/${item._id.year}`);
    const revenueData = sortedRevenue.map(item => item.revenue);

    return {
      labels,
      datasets: [{
        label: 'Doanh thu',
        data: revenueData,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    };
  };

  // Chuẩn bị dữ liệu biểu đồ top sự kiện
  const prepareTopEventsData = () => {
    if (!revenue.topEvents || revenue.topEvents.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Doanh thu theo sự kiện',
          data: [],
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderWidth: 1
        }]
      };
    }

    const labels = revenue.topEvents.map(event => event.eventTitle);
    const revenueData = revenue.topEvents.map(event => event.revenue);

    return {
      labels,
      datasets: [{
        label: 'Doanh thu theo sự kiện',
        data: revenueData,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(201, 203, 207, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderWidth: 1
      }]
    };
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleTimeFrameChange = (frame) => {
    setTimeFrame(frame);
    
    // Tính toán lại khoảng thời gian dựa trên time frame mới
    const endDate = new Date().toISOString().split('T')[0];
    let startDate;
    
    const today = new Date();
    
    switch(frame) {
      case 'week':
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        startDate = lastWeek.toISOString().split('T')[0];
        break;
      case 'month':
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        startDate = lastMonth.toISOString().split('T')[0];
        break;
      case 'quarter':
        const lastQuarter = new Date(today);
        lastQuarter.setMonth(today.getMonth() - 3);
        startDate = lastQuarter.toISOString().split('T')[0];
        break;
      case 'year':
        const lastYear = new Date(today);
        lastYear.setFullYear(today.getFullYear() - 1);
        startDate = lastYear.toISOString().split('T')[0];
        break;
      default:
        startDate = endDate; // Mặc định là hôm nay
    }
    
    setDateRange({ startDate, endDate });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Báo cáo Doanh thu</h1>
        <p className="text-green-100">Thống kê doanh thu và phân tích tài chính</p>
      </div>

      {/* Bộ lọc thời gian */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1 rounded-md ${timeFrame === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              onClick={() => handleTimeFrameChange('week')}
            >
              7 ngày
            </button>
            <button 
              className={`px-3 py-1 rounded-md ${timeFrame === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              onClick={() => handleTimeFrameChange('month')}
            >
              30 ngày
            </button>
            <button 
              className={`px-3 py-1 rounded-md ${timeFrame === 'quarter' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              onClick={() => handleTimeFrameChange('quarter')}
            >
              3 tháng
            </button>
            <button 
              className={`px-3 py-1 rounded-md ${timeFrame === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              onClick={() => handleTimeFrameChange('year')}
            >
              1 năm
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Từ ngày</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Đến ngày</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Doanh thu tháng này</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(getCurrentMonthRevenue())}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng số vé đã bán</p>
              <p className="text-2xl font-bold text-blue-600">
                {revenue.totalRevenue?.totalTickets?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💎</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(revenue.totalRevenue?.totalRevenue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart doanh thu theo thời gian */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Biểu đồ doanh thu theo thời gian</h3>
        <div className="h-80">
          {revenue.monthlyRevenue && revenue.monthlyRevenue.length > 0 ? (
            <Line 
              data={prepareMonthlyRevenueData()} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return formatCurrency(context.raw);
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        if (value >= 1000000) {
                          return (value / 1000000) + ' triệu';
                        }
                        return value;
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Không có dữ liệu doanh thu trong khoảng thời gian đã chọn</p>
            </div>
          )}
        </div>
      </div>

      {/* Biểu đồ phân tích - 2 chart cạnh nhau */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart top sự kiện */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top sự kiện có doanh thu cao nhất</h3>
          <div className="h-80">
            {revenue.topEvents && revenue.topEvents.length > 0 ? (
              <Bar 
                data={prepareTopEventsData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return formatCurrency(context.raw);
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          if (value >= 1000000) {
                            return (value / 1000000) + ' triệu';
                          }
                          return value;
                        }
                      }
                    },
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">Không có dữ liệu sự kiện</p>
              </div>
            )}
          </div>
        </div>

        {/* Thông tin tổng hợp */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Thống kê vé bán</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="h-64">
                <Doughnut
                  data={{
                    labels: revenue.topEvents?.slice(0, 5).map(e => e.eventTitle) || [],
                    datasets: [
                      {
                        label: 'Số vé đã bán',
                        data: revenue.topEvents?.slice(0, 5).map(e => e.tickets) || [],
                        backgroundColor: [
                          'rgba(255, 99, 132, 0.6)',
                          'rgba(54, 162, 235, 0.6)',
                          'rgba(255, 206, 86, 0.6)',
                          'rgba(75, 192, 192, 0.6)',
                          'rgba(153, 102, 255, 0.6)',
                        ],
                        borderColor: [
                          'rgba(255, 99, 132, 1)',
                          'rgba(54, 162, 235, 1)',
                          'rgba(255, 206, 86, 1)',
                          'rgba(75, 192, 192, 1)',
                          'rgba(153, 102, 255, 1)',
                        ],
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      }
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Giá vé trung bình</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(revenue.totalRevenue?.averageTicketPrice)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Tổng số vé đã bán</p>
                <p className="text-xl font-bold text-gray-800">{revenue.totalRevenue?.totalTickets?.toLocaleString() || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Tổng doanh thu</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(revenue.totalRevenue?.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng chi tiết sự kiện có doanh thu cao */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Chi tiết doanh thu theo sự kiện</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên sự kiện</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số vé đã bán</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trung bình/vé</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revenue.topEvents && revenue.topEvents.length > 0 ? (
                revenue.topEvents.map((event, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{event.eventTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.tickets.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(event.revenue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(event.revenue / event.tickets)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueReport; 