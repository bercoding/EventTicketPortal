import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const AdminEventManagement = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const { socket } = useSocket();
    const { user } = useAuth();

    useEffect(() => {
        fetchEvents();
    }, [filter]);

    // Thêm useEffect để tự động refresh khi filter thay đổi thành pending
    useEffect(() => {
        if (filter === 'pending') {
            fetchEvents();
        }
    }, [filter]);

    // Thêm useEffect để tự động refresh khi có sự kiện mới
    useEffect(() => {
        if (filter === 'pending') {
            fetchEvents();
        }
    }, [filter]);

    // Thêm useEffect để lắng nghe sự kiện realtime
    useEffect(() => {
        if (socket && user && user.role === 'admin') {
            // Join admin room khi component mount và user là admin
            socket.emit('join_admin_room');
            console.log('👑 Admin joined admin room');
            
            // Lắng nghe sự kiện khi có sự kiện mới được tạo
            socket.on('new_event_created', (newEvent) => {
                console.log('🎉 New event created:', newEvent);
                toast.info('Có sự kiện mới cần duyệt!', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                // Tự động chuyển sang filter pending và refresh
                setFilter('pending');
                // Thêm delay nhỏ để đảm bảo filter đã được cập nhật
                setTimeout(() => {
                    fetchEvents();
                }, 100);
            });

            // Lắng nghe sự kiện khi có sự kiện được cập nhật
            socket.on('event_updated', (updatedEvent) => {
                console.log('🔄 Event updated:', updatedEvent);
                // Refresh danh sách sự kiện
                fetchEvents();
            });

            return () => {
                socket.off('new_event_created');
                socket.off('event_updated');
            };
        }
    }, [socket, user]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            let url = 'http://localhost:5001/api/admin/events';
            // Add query parameters based on filter
            if (filter !== 'all') {
                if (filter === 'pending') {
                    url += '?status=pending';
                } else {
                    url += `?${filter}=true`;
                }
            }
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.events) {
                setEvents(data.events || []);
            }
        } catch (error) {
            console.error('Lỗi khi tải sự kiện:', error);
            toast.error('Không thể tải danh sách sự kiện');
        } finally {
            setLoading(false);
        }
    };

    const updateEventStatus = async (eventId, statusType, value, order = 0) => {
        try {
            const updateData = {
                [statusType]: value
            };
            
            // Add order field if setting to true
            if (value) {
                updateData[`${statusType}Order`] = order;
            }

            const response = await fetch(`http://localhost:5001/api/events/${eventId}/admin-update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`Đã cập nhật trạng thái ${statusType}`);
                fetchEvents(); // Refresh the list
            } else {
                toast.error('Không thể cập nhật trạng thái');
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật:', error);
            toast.error('Có lỗi xảy ra');
        }
    };

    // Thêm hàm duyệt event
    const handleApproveEvent = async (eventId) => {
        try {
            const response = await adminAPI.approveEvent(eventId);
            if (response.data && response.data.event) {
                toast.success('Duyệt sự kiện thành công!');
                setFilter('approved'); // Chuyển filter sang đã duyệt
                fetchEvents();
            } else {
                toast.error('Không thể duyệt sự kiện');
            }
        } catch (error) {
            toast.error('Lỗi khi duyệt sự kiện');
        }
    };

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.description.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (event) => {
        const badges = [];
        
        if (event.featured) {
            badges.push(
                <span key="featured" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    ⭐ Nổi bật ({event.featuredOrder})
                </span>
            );
        }
        
        if (event.special) {
            badges.push(
                <span key="special" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    🔥 Đặc biệt ({event.specialOrder})
                </span>
            );
        }
        
        if (event.trending) {
            badges.push(
                <span key="trending" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    📈 Xu hướng ({event.trendingOrder})
                </span>
            );
        }
        
        return badges.length > 0 ? badges : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Thường
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900">Quản lý Sự kiện Nổi bật</h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Quản lý các sự kiện featured, special và trending
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sự kiện..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                {['all', 'pending', 'featured', 'special', 'trending'].map((filterOption) => (
                                    <button
                                        key={filterOption}
                                        onClick={() => setFilter(filterOption)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                                            filter === filterOption
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {filterOption === 'all' ? 'Tất cả' :
                                         filterOption === 'pending' ? 'Chờ duyệt' :
                                         filterOption === 'featured' ? 'Nổi bật' :
                                         filterOption === 'special' ? 'Đặc biệt' : 'Xu hướng'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Events List */}
                    <div className="px-6 py-4">
                        {filteredEvents.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-xl mb-2">🎭</div>
                                <p className="text-gray-500">Không tìm thấy sự kiện nào</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredEvents.map((event) => (
                                    <div key={event._id} className="border border-gray-200 rounded-lg p-6">
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            {/* Event Info */}
                                            <div className="flex-1">
                                                <div className="flex items-start gap-4">
                                                    {/* Event Image */}
                                                    <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                                                        {event.images && (event.images.logo || event.images.banner) ? (
                                                            <img
                                                                src={event.images.logo || event.images.banner}
                                                                alt={event.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                📅
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Event Details */}
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                            {event.title}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                            {event.description}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {getStatusBadge(event)}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mb-1">
                                                            <span>📅 {event.startDate ? new Date(event.startDate).toLocaleString('vi-VN') : 'Chưa xác định'}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mb-1">
                                                            <span>📍 {event.location?.venue?.name || event.location?.venueName || event.location?.address || 'Online'}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mb-1">
                                                            {Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0 ? (
                                                                <>
                                                                    <span>💵 Giá vé: {event.ticketTypes.reduce((min, t) => t.price < min ? t.price : min, event.ticketTypes[0].price).toLocaleString('vi-VN')} đ</span>
                                                                    <span className="mx-2">•</span>
                                                                    <span>🎟️ Tổng vé: {event.ticketTypes.reduce((sum, t) => sum + (t.totalQuantity || 0), 0)}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-red-500">Chưa cấu hình vé</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex-shrink-0 lg:w-80">
                                                <div className="grid grid-cols-1 gap-3">
                                                    {/* Featured Toggle */}
                                                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <span>⭐</span>
                                                            <span className="text-sm font-medium">Nổi bật</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {event.featured && (
                                                                <input
                                                                    type="number"
                                                                    value={event.featuredOrder || 0}
                                                                    onChange={(e) => updateEventStatus(event._id, 'featured', true, parseInt(e.target.value))}
                                                                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                                                                    placeholder="Thứ tự"
                                                                />
                                                            )}
                                                            <button
                                                                onClick={() => updateEventStatus(event._id, 'featured', !event.featured)}
                                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                                                                    event.featured ? 'bg-yellow-600' : 'bg-gray-200'
                                                                }`}
                                                            >
                                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                    event.featured ? 'translate-x-5' : 'translate-x-0'
                                                                }`} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Special Toggle */}
                                                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <span>🔥</span>
                                                            <span className="text-sm font-medium">Đặc biệt</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {event.special && (
                                                                <input
                                                                    type="number"
                                                                    value={event.specialOrder || 0}
                                                                    onChange={(e) => updateEventStatus(event._id, 'special', true, parseInt(e.target.value))}
                                                                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                                                                    placeholder="Thứ tự"
                                                                />
                                                            )}
                                                            <button
                                                                onClick={() => updateEventStatus(event._id, 'special', !event.special)}
                                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                                                                    event.special ? 'bg-red-600' : 'bg-gray-200'
                                                                }`}
                                                            >
                                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                    event.special ? 'translate-x-5' : 'translate-x-0'
                                                                }`} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Trending Toggle */}
                                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <span>📈</span>
                                                            <span className="text-sm font-medium">Xu hướng</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {event.trending && (
                                                                <input
                                                                    type="number"
                                                                    value={event.trendingOrder || 0}
                                                                    onChange={(e) => updateEventStatus(event._id, 'trending', true, parseInt(e.target.value))}
                                                                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                                                                    placeholder="Thứ tự"
                                                                />
                                                            )}
                                                            <button
                                                                onClick={() => updateEventStatus(event._id, 'trending', !event.trending)}
                                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                                                                    event.trending ? 'bg-green-600' : 'bg-gray-200'
                                                                }`}
                                                            >
                                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                    event.trending ? 'translate-x-5' : 'translate-x-0'
                                                                }`} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Approve Button */}
                                                    {event.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleApproveEvent(event._id)}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                        >
                                                            ✅ Duyệt
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminEventManagement;
