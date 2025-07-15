import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import TicketScanner from './TicketScanner';

const TicketManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      const response = await adminAPI.getEvents();
      
      if (response && Array.isArray(response.events)) {
        const eventsData = response.events || [];
        setEvents(eventsData);
        
        if (eventsData.length === 0) {
          toast.info('Không tìm thấy sự kiện nào');
        } else {
          toast.success(`Tìm thấy ${eventsData.length} sự kiện`);
        }
      } else {
        toast.error('Định dạng dữ liệu không hợp lệ từ API');
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Không thể lấy danh sách sự kiện');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không xác định';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
      return new Date(dateString).toLocaleDateString('vi-VN', options);
    } catch (error) {
      return 'Không xác định';
    }
  };

  // Chọn sự kiện để quản lý vé
  const selectEvent = (event) => {
    setSelectedEvent(event);
    toast.info(`Đã chọn sự kiện "${event.title}"`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Quản lý vé sự kiện</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Chọn sự kiện</h2>
        
        {loading ? (
          <p className="text-center py-4">Đang tải danh sách sự kiện...</p>
        ) : events.length === 0 ? (
          <div>
            <p className="text-center py-4 mb-4">Không có sự kiện nào</p>
            <button
              onClick={fetchEvents}
              className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              Tải lại dữ liệu
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Tên sự kiện</th>
                  <th className="py-3 px-4 text-left">ID</th>
                  <th className="py-3 px-4 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {events.map((event, index) => (
                  <tr key={event._id || `event-${index}`} className="hover:bg-gray-50">
                    <td className="py-3 px-4">{event.title}</td>
                    <td className="py-3 px-4">{event._id}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => selectEvent(event)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Quản lý vé
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">
              Quét vé cho: {selectedEvent.title}
            </h2>
            <button
              onClick={() => setSelectedEvent(null)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
            >
              Quay lại danh sách
            </button>
          </div>
          
          <TicketScanner eventId={selectedEvent._id} />
        </div>
      )}
    </div>
  );
};

export default TicketManagement; 