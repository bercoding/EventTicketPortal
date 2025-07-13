import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt, FaClock, FaUsers, FaInfoCircle } from 'react-icons/fa';
import { eventAPI } from '../services/api';
import { toast } from 'react-toastify';
import { getEventPlaceholder, handleImageError } from '../utils/imageHelpers';
import ReviewSection from './ReviewSection';

// This is a "dumb" component, focused only on displaying event details.
// All booking logic has been moved to the `SelectSeatPage`.
const EventDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) {
                navigate('/');
                return;
            }
            try {
                setLoading(true);
                console.log('🔍 EventDetailPage: Fetching event with ID:', id);
                const response = await eventAPI.getEventById(id);
                
                if (response.data?.success) {
                    console.log('✅ EventDetailPage: Event loaded successfully:', response.data.data.title);
                    setEvent(response.data.data);
                } else if (response.success && response.data) {
                    console.log('🔄 EventDetailPage: Using direct response structure');
                    setEvent(response.data);
                } else {
                    toast.error("Không tìm thấy sự kiện hoặc có lỗi xảy ra.");
                    navigate('/events');
                }
            } catch (error) {
                console.error("❌ EventDetailPage: Error loading event:", error);
                toast.error("Lỗi máy chủ, không thể tải dữ liệu sự kiện.");
                navigate('/events');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id, navigate]);

    const handleBookNow = () => {
        if (!event) {
            toast.error("Dữ liệu sự kiện không có sẵn.");
            return;
        }
        
        const hasSeatingMap = event.seatingMap && 
                             event.seatingMap.sections && 
                             event.seatingMap.sections.length > 0;
        
        const isOnlineEvent = event.location?.type === 'online';
        const isOutdoorEvent = event.location?.venueLayout === 'outdoor' || 
                               event.location?.venueName?.toLowerCase().includes('ngoài trời');
        
        if (hasSeatingMap) {
            navigate(`/events/${id}/select-seats`);
        } else if (isOnlineEvent || isOutdoorEvent) {
            navigate(`/simple-booking/${id}`);
        } else {
            navigate(`/booking/${id}`);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa xác định';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return 'Chưa xác định';
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getMinPrice = () => {
        if (!event.ticketTypes || event.ticketTypes.length === 0) {
            return 'Liên hệ';
        }
        const minPrice = Math.min(...event.ticketTypes.map(ticket => ticket.price));
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(minPrice);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-lg text-gray-600">Đang tải thông tin sự kiện...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="text-center p-10 bg-gray-50 min-h-screen flex items-center justify-center">
                <div>
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Không thể tải sự kiện</h2>
                    <button 
                        onClick={() => navigate('/events')} 
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Quay lại danh sách sự kiện
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Event Banner */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="relative h-80 md:h-96">
                                <img 
                                    src={
                                        event.images && typeof event.images === 'object' && !Array.isArray(event.images) 
                                            ? (event.images.banner || event.images.logo || getEventPlaceholder())
                                            : (event.images?.[0] ? `http://localhost:5001${event.images[0]}` : getEventPlaceholder())
                                    } 
                                    alt={event.title} 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => handleImageError(e, 'event')} 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                <div className="absolute bottom-6 left-6 right-6">
                                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                                        {event.title}
                                    </h1>
                                    {event.organizers && event.organizers.length > 0 && (
                                        <p className="text-lg text-gray-200">
                                            Tổ chức bởi {event.organizers.map(o => o.fullName || o.username).join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Event Description */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                <FaInfoCircle className="text-blue-600 mr-3" />
                                Giới thiệu
                            </h2>
                            <div className="prose max-w-none text-gray-700 leading-relaxed">
                                {event.description ? (
                                    <div dangerouslySetInnerHTML={{ __html: event.description }} />
                                ) : (
                                    <p>Chưa có mô tả chi tiết cho sự kiện này.</p>
                                )}
                            </div>
                        </div>

                        {/* Venue Information */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                <FaMapMarkerAlt className="text-red-500 mr-3" />
                                Địa điểm tổ chức
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800">
                                        {event.location?.venueName || 'Chưa xác định địa điểm'}
                                    </h3>
                                    <p className="text-gray-600">
                                        {event.location?.address ? 
                                            `${event.location.address}, ${event.location.city || ''}` : 
                                            'Địa chỉ sẽ được cập nhật'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Booking Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                            {/* Event Title & Category */}
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">
                                    {event.title}
                                </h2>
                                {event.category && (
                                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                        {event.category}
                                    </span>
                                )}
                            </div>

                            {/* Event Details */}
                            <div className="space-y-4 mb-6">
                                <div className="flex items-start">
                                    <FaCalendarAlt className="text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-800">Thời gian</p>
                                        <p className="text-gray-600">
                                            {formatDate(event.startDate)}
                                        </p>
                                        <p className="text-gray-600 text-sm">
                                            {formatTime(event.startDate)} - {formatTime(event.endDate)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <FaMapMarkerAlt className="text-red-500 mr-3 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-800">Địa điểm</p>
                                        <p className="text-gray-600">
                                            {event.location?.venueName || 'Chưa xác định'}
                                        </p>
                                        <p className="text-gray-500 text-sm">
                                            {event.location?.city || ''}
                                        </p>
                                    </div>
                                </div>

                                {event.ticketTypes && event.ticketTypes.length > 0 && (
                                    <div className="flex items-start">
                                        <FaTicketAlt className="text-green-600 mr-3 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-gray-800">Giá vé</p>
                                            <p className="text-lg font-bold text-green-600">
                                                Từ {getMinPrice()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleBookNow}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 flex items-center justify-center text-lg"
                            >
                                <FaTicketAlt className="mr-3"/>
                                Mua vé ngay
                            </button>

                            {/* Additional Info */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                    <FaUsers className="mr-2" />
                                    <span>Sự kiện được tổ chức bởi {event.organizers?.[0]?.fullName || 'Đối tác'}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <FaClock className="mr-2" />
                                    <span>Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</span>
                                </div>
                            </div>
                             {/* Event Description */}
                             <ReviewSection eventId={id} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailPage;