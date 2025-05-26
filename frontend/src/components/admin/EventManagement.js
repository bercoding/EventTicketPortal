import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const EventManagement = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getEvents();
            setEvents(response.data.events || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveEvent = async (eventId) => {
        try {
            await adminAPI.approveEvent(eventId);
            fetchEvents();
        } catch (error) {
            console.error('Error approving event:', error);
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            event.organizer?.username?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || event.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: '⏳', text: 'Chờ duyệt' },
            approved: { color: 'bg-green-100 text-green-800', icon: '✅', text: 'Đã duyệt' },
            rejected: { color: 'bg-red-100 text-red-800', icon: '❌', text: 'Từ chối' },
            cancelled: { color: 'bg-gray-100 text-gray-800', icon: '🚫', text: 'Đã hủy' }
        };
        
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.icon} {config.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
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
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
                <h1 className="text-2xl font-bold mb-2">Quản lý Events</h1>
                <p className="text-green-100">Duyệt và quản lý các sự kiện trên hệ thống</p>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên event hoặc organizer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filter */}
                    <div className="flex items-center space-x-4">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="pending">Chờ duyệt</option>
                            <option value="approved">Đã duyệt</option>
                            <option value="rejected">Từ chối</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>

                        <div className="text-sm text-gray-600">
                            Tổng: <span className="font-semibold">{filteredEvents.length}</span> events
                        </div>
                    </div>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                    <div key={event._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        {/* Event Image */}
                        <div className="h-48 bg-gradient-to-r from-green-400 to-blue-500 relative">
                            {event.image ? (
                                <img 
                                    src={event.image} 
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-white text-6xl">🎫</span>
                                </div>
                            )}
                            <div className="absolute top-4 right-4">
                                {getStatusBadge(event.status)}
                            </div>
                        </div>

                        {/* Event Content */}
                        <div className="p-6">
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                                    {event.title}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {event.description}
                                </p>
                            </div>

                            {/* Event Details */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {event.organizer?.username || 'Unknown'}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {formatDate(event.date)}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {event.location?.address || event.location?.city || 'Không có địa chỉ'}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    {formatCurrency(event.ticketPrice)}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setSelectedEvent(event);
                                        setShowModal(true);
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Chi tiết
                                </button>

                                {event.status === 'pending' && (
                                    <button
                                        onClick={() => handleApproveEvent(event._id)}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Duyệt
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredEvents.length === 0 && !loading && (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-4xl">🎫</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không có events</h3>
                    <p className="text-gray-600">Không tìm thấy events nào với bộ lọc hiện tại</p>
                </div>
            )}

            {/* Event Detail Modal */}
            {showModal && selectedEvent && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-xl bg-white">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Chi tiết Event</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Event Image */}
                            <div className="h-64 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl overflow-hidden">
                                {selectedEvent.image ? (
                                    <img 
                                        src={selectedEvent.image} 
                                        alt={selectedEvent.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-white text-8xl">🎫</span>
                                    </div>
                                )}
                            </div>

                            {/* Event Details */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{selectedEvent.title}</h4>
                                    <p className="text-gray-600">{selectedEvent.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Organizer</label>
                                        <p className="text-gray-900">{selectedEvent.organizer?.username}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                                        {getStatusBadge(selectedEvent.status)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Ngày diễn ra</label>
                                        <p className="text-gray-900">{formatDate(selectedEvent.date)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Địa điểm</label>
                                        <p className="text-gray-900">{selectedEvent.location?.address || selectedEvent.location?.city || 'Không có địa chỉ'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Giá vé</label>
                                        <p className="text-gray-900">{formatCurrency(selectedEvent.ticketPrice)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Số lượng vé</label>
                                        <p className="text-gray-900">{selectedEvent.totalTickets}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center space-x-3 pt-4">
                                    {selectedEvent.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    handleApproveEvent(selectedEvent._id);
                                                    setShowModal(false);
                                                }}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                ✅ Duyệt Event
                                            </button>
                                            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                                ❌ Từ chối
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventManagement; 