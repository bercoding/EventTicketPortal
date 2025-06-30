import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventAPI } from '../services/api';
import { FaChair, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';

const EventListTest = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await eventAPI.getAllEvents();
                if (response.data?.success) {
                    // Lọc chỉ các sự kiện có seatingMap
                    const eventsWithSeating = response.data.data.filter(event => 
                        event.seatingMap && 
                        event.seatingMap.sections && 
                        event.seatingMap.sections.length > 0
                    );
                    setEvents(eventsWithSeating);
                }
            } catch (error) {
                console.error('Lỗi khi tải sự kiện:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-lg">Đang tải danh sách sự kiện...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    <FaChair className="inline mr-3 text-blue-600" />
                    Sự kiện có chọn ghế
                </h1>
                <p className="text-gray-600">
                    Danh sách các sự kiện có sẵn sơ đồ chỗ ngồi để đặt vé
                </p>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-12">
                    <FaChair className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-500 mb-2">
                        Không có sự kiện nào có sơ đồ chỗ ngồi
                    </h2>
                    <p className="text-gray-400">
                        Vui lòng tạo sự kiện mới với tính năng chọn ghế
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <div key={event._id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                            <img 
                                src={event.images?.banner || event.images?.logo || 'https://via.placeholder.com/400x200?text=Event'} 
                                alt={event.title}
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-3">
                                    {event.title}
                                </h3>
                                
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-gray-600">
                                        <FaCalendarAlt className="mr-2 text-blue-500" />
                                        <span className="text-sm">
                                            {new Date(event.startDate).toLocaleDateString('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit', 
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center text-gray-600">
                                        <FaMapMarkerAlt className="mr-2 text-red-500" />
                                        <span className="text-sm">
                                            {event.location?.venueName || event.location?.address || 'Không rõ địa điểm'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center text-green-600">
                                        <FaChair className="mr-2" />
                                        <span className="text-sm font-semibold">
                                            {event.seatingMap.sections.length} khu vực ghế
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-green-600 font-bold">
                                        {event.ticketTypes && event.ticketTypes.length > 0 
                                            ? `Từ ${Math.min(...event.ticketTypes.map(t => t.price)).toLocaleString('vi-VN')} VND`
                                            : 'Miễn phí'
                                        }
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        ID: {event._id.slice(-6)}
                                    </div>
                                </div>

                                <div className="flex space-x-2">
                                    <Link 
                                        to={`/events/${event._id}`}
                                        className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Xem chi tiết
                                    </Link>
                                    <Link 
                                        to={`/events/${event._id}/select-seats`}
                                        className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Chọn ghế
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventListTest; 