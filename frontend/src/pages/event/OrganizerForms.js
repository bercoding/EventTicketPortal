import React from 'react';
import { useAuth } from '../../context/AuthContext';

const OrganizerForms = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'event_owner') {
    return (
      <div className="w-full px-4 py-8 bg-gray-900 text-white min-h-screen">
        <div className="bg-red-700 text-white px-4 py-3 rounded">
          Bạn không có quyền truy cập trang này. Vui lòng đăng nhập với vai trò Event Owner.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-white">Biểu mẫu cho ban tổ chức</h1>
      <p className="text-gray-300">Đây là nơi bạn có thể tìm thấy các biểu mẫu và tài liệu hữu ích cho việc tổ chức sự kiện.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-white mb-2">Mẫu kế hoạch sự kiện</h2>
          <p className="text-gray-400 mb-4">Tải về mẫu kế hoạch chi tiết để tổ chức sự kiện hiệu quả.</p>
          <a href="#" className="text-blue-500 hover:underline">Tải xuống</a>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-white mb-2">Hướng dẫn tiếp thị</h2>
          <p className="text-gray-400 mb-4">Tài liệu hướng dẫn cách quảng bá sự kiện của bạn.</p>
          <a href="#" className="text-blue-500 hover:underline">Tải xuống</a>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-white mb-2">Biểu mẫu đăng ký</h2>
          <p className="text-gray-400 mb-4">Mẫu biểu mẫu đăng ký có thể tùy chỉnh cho người tham gia.</p>
          <a href="#" className="text-blue-500 hover:underline">Tải xuống</a>
        </div>
      </div>
    </div>
  );
};

export default OrganizerForms; 