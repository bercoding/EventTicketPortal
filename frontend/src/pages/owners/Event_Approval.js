import React, { useState } from 'react';
import { FaEye, FaFilter } from 'react-icons/fa'; // Import icons từ react-icons

const ApprovalEvents = () => {
  // Dữ liệu mẫu của các sự kiện
  const [events, setEvents] = useState([
    {
      fileName: 'Sự kiện A',
      createdDate: '2025-05-01',
      creator: 'Nguyễn Văn A',
      status: 'Đã duyệt',
    },
    {
      fileName: 'Sự kiện B',
      createdDate: '2025-05-02',
      creator: 'Trần Thị B',
      status: 'Chưa duyệt',
    },
    {
      fileName: 'Sự kiện C',
      createdDate: '2025-05-03',
      creator: 'Lê Minh C',
      status: 'Đã duyệt',
    },
     {
      fileName: 'Sự kiện A',
      createdDate: '2025-05-01',
      creator: 'Nguyễn Văn A',
      status: 'Đã duyệt',
    },
    {
      fileName: 'Sự kiện B',
      createdDate: '2025-05-02',
      creator: 'Trần Thị B',
      status: 'Chưa duyệt',
    },
    {
      fileName: 'Sự kiện C',
      createdDate: '2025-05-03',
      creator: 'Lê Minh C',
      status: 'Đã duyệt',
    },
     {
      fileName: 'Sự kiện A',
      createdDate: '2025-05-01',
      creator: 'Nguyễn Văn A',
      status: 'Đã duyệt',
    },
    {
      fileName: 'Sự kiện B',
      createdDate: '2025-05-02',
      creator: 'Trần Thị B',
      status: 'Chưa duyệt',
    },
    {
      fileName: 'Sự kiện C',
      createdDate: '2025-05-03',
      creator: 'Lê Minh C',
      status: 'Đã duyệt',
    },
  ]);

  // State để lọc trạng thái
  const [filterStatus, setFilterStatus] = useState('Tất cả');

  // Hàm lọc sự kiện theo trạng thái
  const filteredEvents = filterStatus === 'Tất cả'
    ? events
    : events.filter(event => event.status === filterStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
          {/* Nền trang trí */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-teal-500/10 rounded-3xl"></div>

          {/* Tiêu đề chính */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 mb-10 tracking-tight relative z-10">
            Danh Sách Các Sự Kiện Phê Duyệt
            <div className="mt-2 h-1 bg-gradient-to-r from-indigo-500 to-teal-500 w-32 mx-auto rounded-full"></div>
          </h1>

          {/* Bộ lọc trạng thái */}
          <div className="flex justify-end mb-6">
            <div className="relative inline-flex items-center">
              <FaFilter className="text-indigo-600 mr-2" />
              <select
                className="appearance-none bg-indigo-100 text-indigo-800 font-semibold px-4 py-2 pr-8 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option>Tất cả</option>
                <option>Đã duyệt</option>
                <option>Chưa duyệt</option>
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Bảng sự kiện */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="text-left text-sm font-semibold text-gray-600 bg-gray-100 rounded-t-lg">
                  <th className="px-6 py-4">File</th>
                  <th className="px-6 py-4">Ngày Tạo</th>
                  <th className="px-6 py-4">Người Tạo</th>
                  <th className="px-6 py-4 text-center">Trạng Thái Xử Lý</th>
                  <th className="px-6 py-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event, index) => (
                  <tr
                    key={index}
                    className={`border-b border-gray-100 transition-all duration-300 hover:bg-indigo-50/50 ${
                      event.status === 'Đã duyệt' ? 'bg-green-50/50' : 'bg-red-50/50'
                    } animate__animated animate__fadeInUp`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{event.fileName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{event.createdDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{event.creator}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          event.status === 'Đã duyệt'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105"
                      >
                        <FaEye className="mr-2" />
                        Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Thông báo khi không có sự kiện */}
          {filteredEvents.length === 0 && (
            <div className="text-center text-gray-500 mt-6">
              Không tìm thấy sự kiện nào với trạng thái đã chọn.
            </div>
          )}

          {/* Footer nhỏ */}
          <div className="mt-10 text-center text-gray-500 text-sm">
            © 2025 Quy định sự kiện. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalEvents;