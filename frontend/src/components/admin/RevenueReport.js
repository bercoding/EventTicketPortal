import React, { useState, useEffect } from 'react';
// import { adminAPI } from '../../services/api'; // adminAPI không còn được sử dụng sau khi comment fetchRevenue

const RevenueReport = () => {
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      // const response = await adminAPI.getRevenue(); // Dữ liệu response chưa được sử dụng
      // setRevenue(response.data); // Dữ liệu revenue chưa được sử dụng trong component này
    } catch (error) {
      console.error('Error fetching revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
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

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Doanh thu hôm nay</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Doanh thu tháng này</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(0)}</p>
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
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Biểu đồ doanh thu theo thời gian</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl mb-4 block">📈</span>
            <p className="text-gray-600">Biểu đồ sẽ được hiển thị ở đây</p>
            <p className="text-sm text-gray-500 mt-2">Tích hợp Chart.js trong phiên bản tiếp theo</p>
          </div>
        </div>
      </div>

      {/* Revenue Details */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Chi tiết doanh thu</h3>
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">💼</span>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Chức năng đang phát triển</h4>
          <p className="text-gray-600">Chi tiết báo cáo doanh thu sẽ được triển khai trong phiên bản tiếp theo</p>
        </div>
      </div>
    </div>
  );
};

export default RevenueReport; 