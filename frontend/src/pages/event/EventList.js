import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faTrashAlt, faCalendarAlt, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import useEventListLogic from '../../hooks/useEventListLogic';

const EventList = () => {
  const {
    events,
    loading,
    showConfirmDialog,
    handleViewDetails,
    handleDeleteEvent,
    confirmDeleteEvent,
    cancelDeleteEvent,
    user
  } = useEventListLogic();

  if (loading) {
    return <div className="w-full px-4 py-8 text-white min-h-screen">Đang tải sự kiện...</div>;
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
      <h1 className="text-3xl font-bold mb-8 text-white">Danh sách sự kiện của tôi</h1>
      {events.length === 0 ? (
        <p className="text-lg text-gray-400">Bạn chưa tạo sự kiện nào. Hãy tạo sự kiện đầu tiên của bạn ngay!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map((event) => (
            <div key={event._id} className="bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col transform transition-transform duration-300 hover:scale-105 border border-gray-700">
              <div className="relative h-48 bg-gray-700 flex items-center justify-center">
                <img src={event.images.banner || 'https://via.placeholder.com/400x200?text=Event+Banner'} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                <h2 className="absolute bottom-4 left-4 text-2xl font-bold text-white leading-tight">{event.title}</h2>
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">{event.description}</p>
                  <div className="text-gray-300 text-sm mb-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-blue-400" />
                    Ngày: {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                  </div>
                  <div className="text-gray-300 text-sm mb-4">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-green-400" />
                    Địa điểm: {event.location.type === 'offline' ? event.location.venueName || event.location.city : 'Trực tuyến'}
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center space-x-2">
                  <button
                    onClick={() => handleViewDetails(event._id)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center text-sm font-medium"
                  >
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                    Xem chi tiết
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event._id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center justify-center text-sm font-medium"
                  >
                    <FontAwesomeIcon icon={faTrashAlt} className="mr-2" />
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-4 text-white">Xác nhận xóa sự kiện</h3>
            <p className="text-gray-300 mb-6">Bạn có chắc chắn muốn xóa sự kiện này? Thao tác này không thể hoàn tác.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDeleteEvent}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteEvent}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventList; 