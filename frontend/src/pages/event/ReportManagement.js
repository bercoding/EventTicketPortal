import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';

const ReportManagement = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await api.get(`/events/owner/${user._id}`);
        const fetchedEvents = response.data.data;
        setEvents(fetchedEvents);

        // Calculate aggregated statistics
        let views = 0;
        let likes = 0;
        let participants = 0;

        fetchedEvents.forEach(event => {
          views += event.views || 0; 
          likes += event.likes || 0; 

          participants += event.attendeesCount || 0; 
        });

        setTotalViews(views);
        setTotalLikes(likes);
        setTotalParticipants(participants);

      } catch (error) {
        console.error('Error fetching events for reports:', error);
        toast.error('Không thể tải dữ liệu báo cáo sự kiện.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  if (loading) {
    return (
      <div className="w-full px-4 py-8 bg-gray-900 text-white min-h-screen">
        <div className="text-center">Đang tải báo cáo...</div>
      </div>
    );
  }

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
      <h1 className="text-3xl font-bold mb-8 text-white">Bảng điều khiển báo cáo sự kiện</h1>
      
      {/* statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-400">Tổng lượt xem</p>
          <h2 className="text-4xl font-bold text-white mt-2">{totalViews}</h2>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-400">Tổng lượt thích</p>
          <h2 className="text-4xl font-bold text-white mt-2">{totalLikes}</h2>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-400">Tổng người tham gia</p>
          <h2 className="text-4xl font-bold text-white mt-2">{totalParticipants}</h2>
        </div>
      </div>

      {/* event list / view detail */}
      <h2 className="text-2xl font-bold mb-6 text-white">Thống kê chi tiết từng sự kiện</h2>
      {events.length === 0 ? (
        <p className="text-gray-300">Bạn chưa có sự kiện nào để tạo báo cáo.</p>
      ) : (
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tên sự kiện</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lượt xem</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lượt thích</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Người tham gia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {events.map((event) => (
                  <tr key={event._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{event.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{event.views || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{event.likes || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{event.attendeesCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement; 