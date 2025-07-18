import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FiEdit2, FiTrash2, FiEye, FiPlus, FiCalendar, FiMapPin, FiUsers, FiDollarSign } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getEventPlaceholder, handleImageError } from '../utils/imageHelpers';

const MyEvents = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, upcoming, past, draft

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/events/my-events');
            setEvents(response.data);
        } catch (error) {
            console.error('Error fetching my events:', error);
            setError('Không thể tải danh sách sự kiện của bạn');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) return;
        
        try {
            await api.delete(`/events/${eventId}`);
            setEvents(events.filter(event => event._id !== eventId));
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Không thể xóa sự kiện');
        }
    };

    const getFilteredEvents = () => {
        const now = new Date();
        switch (filter) {
            case 'upcoming':
                return events.filter(event => new Date(event.startDate) > now);
            case 'past':
                return events.filter(event => new Date(event.endDate) < now);
            case 'draft':
                return events.filter(event => event.status === 'draft');
            default:
                return events;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'active': { color: 'bg-green-100 text-green-800', text: 'Đang hoạt động' },
            'draft': { color: 'bg-gray-100 text-gray-800', text: 'Bản nháp' },
            'cancelled': { color: 'bg-red-100 text-red-800', text: 'Đã hủy' },
            'completed': { color: 'bg-blue-100 text-blue-800', text: 'Đã hoàn thành' }
        };
        const config = statusConfig[status] || statusConfig['draft'];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Đang tải sự kiện...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="sm:flex sm:items-center sm:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quản lý sự kiện của tôi</h1>
                        <p className="mt-2 text-gray-600">Quản lý và theo dõi các sự kiện bạn đã tạo</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <Link
                            to="/create-event"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <FiPlus className="mr-2 h-4 w-4" />
                            Tạo sự kiện mới
                        </Link>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="mb-6">
                    <nav className="flex space-x-8" aria-label="Tabs">
                        {[
                            { key: 'all', name: 'Tất cả', count: events.length },
                            { key: 'upcoming', name: 'Sắp diễn ra', count: events.filter(e => new Date(e.startDate) > new Date()).length },
                            { key: 'past', name: 'Đã qua', count: events.filter(e => new Date(e.endDate) < new Date()).length },
                            { key: 'draft', name: 'Bản nháp', count: events.filter(e => e.status === 'draft').length }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                                    filter === tab.key
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.name} ({tab.count})
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={fetchMyEvents}
                            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {/* Events Grid */}
                {getFilteredEvents().length === 0 ? (
                    <div className="text-center py-12">
                        <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có sự kiện nào</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {filter === 'all' 
                                ? 'Bắt đầu bằng cách tạo sự kiện đầu tiên của bạn'
                                : `Không có sự kiện nào trong danh mục "${filter === 'upcoming' ? 'sắp diễn ra' : filter === 'past' ? 'đã qua' : 'bản nháp'}"`
                            }
                        </p>
                        {filter === 'all' && (
                            <div className="mt-6">
                                <Link
                                    to="/create-event"
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <FiPlus className="mr-2 h-4 w-4" />
                                    Tạo sự kiện mới
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {getFilteredEvents().map((event) => (
                            <div
                                key={event._id}
                                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
                            >
                                {/* Event Image */}
                                <div className="h-48 w-full relative">
                                    <img
                                        src={
                                            event.images && typeof event.images === 'object' && !Array.isArray(event.images) 
                                                ? (event.images.banner || event.images.logo || getEventPlaceholder())
                                                : (event.images && event.images.length > 0 ? `http://localhost:5001${event.images[0]}` : getEventPlaceholder())
                                        }
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => handleImageError(e, 'event')}
                                    />
                                    <div className="absolute top-2 right-2">
                                        {getStatusBadge(event.status)}
                                    </div>
                                </div>

                                {/* Event Content */}
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-medium text-gray-900 truncate">
                                            {event.title}
                                        </h3>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                                        <div className="flex items-center">
                                            <FiCalendar className="flex-shrink-0 mr-2 h-4 w-4" />
                                            <span>{formatDate(event.startDate)}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <FiMapPin className="flex-shrink-0 mr-2 h-4 w-4" />
                                            <span className="truncate">
                                                {event.location?.type === 'online' 
                                                    ? 'Sự kiện online' 
                                                    : event.location?.venueName || 'Địa điểm chưa xác định'
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <FiUsers className="flex-shrink-0 mr-2 h-4 w-4" />
                                            <span>
                                                {event.ticketTypes?.reduce((total, ticket) => total + ticket.soldQuantity, 0) || 0}/
                                                {event.ticketTypes?.reduce((total, ticket) => total + ticket.totalQuantity, 0) || 0} vé
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <FiDollarSign className="flex-shrink-0 mr-2 h-4 w-4" />
                                            <span>
                                                {event.ticketTypes?.length 
                                                    ? `${Math.min(...event.ticketTypes.map(t => t.price)).toLocaleString('vi-VN')} - ${Math.max(...event.ticketTypes.map(t => t.price)).toLocaleString('vi-VN')} VNĐ`
                                                    : 'Miễn phí'
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex space-x-2">
                                        <Link
                                            to={`/events/${event._id}`}
                                            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <FiEye className="mr-1 h-4 w-4" />
                                            Xem
                                        </Link>
                                        <Link
                                            to={`/events/${event._id}/manage`}
                                            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <FiEdit2 className="mr-1 h-4 w-4" />
                                            Sửa
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteEvent(event._id)}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            <FiTrash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyEvents; 