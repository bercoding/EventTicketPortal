import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt, FaClock, FaUsers, FaInfoCircle, FaMoon, FaMagic, FaStar, FaHeart, FaShare, FaArrowLeft } from 'react-icons/fa';
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
            setLoading(true);
            try {
                console.log('🔍 EventDetailPage: Fetching event data for ID:', id);
                const response = await eventAPI.getEventById(id);
                
                if (response && response.success && response.data) {
                    console.log('✅ EventDetailPage: Event data loaded:', response.data);
                    setEvent(response.data);
                } else {
                    console.log('❌ EventDetailPage: No valid data found in response');
                    toast.error("Không tìm thấy sự kiện hoặc có lỗi xảy ra.");
                    navigate('/events');
                }
            } catch (error) {
                console.error("❌ EventDetailPage: Error loading event:", error);
                
                // Check if this is a 403 error (event has already started)
                if (error.response && error.response.status === 403) {
                    toast.error("Sự kiện này đã bắt đầu và không còn mở để đặt vé.");
                } else {
                    toast.error("Lỗi máy chủ, không thể tải dữ liệu sự kiện.");
                }
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
        
        // Restore original logic to choose appropriate booking flow
        if (hasSeatingMap) {
            console.log('🎭 Redirecting to seat selection for event with seating map');
            navigate(`/events/${id}/select-seats`);
        } else if (isOnlineEvent || isOutdoorEvent) {
            console.log('🎫 Redirecting to simple booking for online/outdoor event');
            navigate(`/simple-booking/${id}`);
        } else {
            console.log('🎫 Redirecting to standard booking');
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

    // Helper function to get event image
    const getEventImage = (event) => {
        if (event.images && Array.isArray(event.images) && event.images.length > 0) {
            return `http://localhost:5001${event.images[0]}`;
        } else if (event.images && typeof event.images === 'object' && !Array.isArray(event.images)) {
            return event.images.banner || event.images.logo;
        } else if (event.image) {
            return event.image;
        } else if (event.eventImage) {
            return event.eventImage;
        }
        return "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black relative overflow-hidden">
                {/* Sparkling Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
                    <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="absolute top-40 right-32 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-1000"></div>
                    <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-500"></div>
                </div>

                <div className="relative z-10 flex justify-center items-center h-screen">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
                        <p className="mt-6 text-xl text-blue-300">Đang tải thông tin sự kiện...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-black relative overflow-hidden">
                {/* Sparkling Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
                </div>

                <div className="relative z-10 text-center p-10 min-h-screen flex items-center justify-center">
                    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/30">
                        <h2 className="text-3xl font-bold text-red-400 mb-6">Không thể tải sự kiện</h2>
                        <button 
                            onClick={() => navigate('/events')} 
                            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                        >
                            Quay lại danh sách sự kiện
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Sparkling Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
                <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="absolute top-40 right-32 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-1000"></div>
                <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-500"></div>
                <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-1500"></div>
                <div className="absolute top-1/3 left-1/3 w-1 h-1 bg-cyan-400 rounded-full animate-pulse delay-2000"></div>
            </div>

            <div className="relative z-10">
                {/* Back Button */}
                <div className="absolute top-6 left-6 z-20">
                    <button
                        onClick={() => navigate('/events')}
                        className="bg-gray-900/50 backdrop-blur-sm text-blue-300 p-3 rounded-xl border border-blue-500/30 hover:bg-gray-800/70 hover:text-blue-200 transition-all duration-300"
                    >
                        <FaArrowLeft className="text-xl" />
                    </button>
                </div>

                {/* Hero Section with Full Image */}
                <div className="relative h-screen">
                    <img 
                        src={getEventImage(event)}
                        alt={event.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80";
                        }}
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    
                    {/* Event Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex items-center mb-4">
                                <FaMoon className="text-blue-400 mr-3 text-2xl" />
                                <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent text-2xl font-bold">
                                    {event.category || 'Sự kiện'}
                                </span>
                            </div>
                            
                            <h1 className="text-5xl md:text-7xl font-bold text-blue-200 mb-6" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.8)' }}>
                                {event.title}
                            </h1>
                            
                            {event.organizers && event.organizers.length > 0 && (
                                <p className="text-xl text-blue-300 mb-6">
                                    Tổ chức bởi {event.organizers.map(o => o.fullName || o.username).join(', ')}
                                </p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-4 mb-8">
                                <button
                                    onClick={handleBookNow}
                                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 flex items-center"
                                >
                                    <FaTicketAlt className="mr-3 text-xl" />
                                    Đặt vé ngay
                                </button>
                                
                                <button className="bg-gray-900/50 backdrop-blur-sm text-blue-300 font-bold py-4 px-6 rounded-xl border border-blue-500/30 hover:bg-gray-800/70 transition-all duration-300 flex items-center">
                                    <FaHeart className="mr-3" />
                                    Yêu thích
                                </button>
                                
                                <button className="bg-gray-900/50 backdrop-blur-sm text-blue-300 font-bold py-4 px-6 rounded-xl border border-blue-500/30 hover:bg-gray-800/70 transition-all duration-300 flex items-center">
                                    <FaShare className="mr-3" />
                                    Chia sẻ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="max-w-7xl mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Event Description */}
                            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-blue-500/30 p-8">
                                <h2 className="text-3xl font-bold text-blue-200 mb-6 flex items-center">
                                    <FaInfoCircle className="text-blue-400 mr-4 text-2xl" />
                                    Giới thiệu
                                </h2>
                                <div className="prose prose-invert max-w-none text-blue-300 leading-relaxed">
                                    {event.description ? (
                                        <div dangerouslySetInnerHTML={{ __html: event.description }} />
                                    ) : (
                                        <p className="text-blue-300/80">Chưa có mô tả chi tiết cho sự kiện này.</p>
                                    )}
                                </div>
                            </div>

                            {/* Venue Information */}
                            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-blue-500/30 p-8">
                                <h2 className="text-3xl font-bold text-blue-200 mb-6 flex items-center">
                                    <FaMapMarkerAlt className="text-blue-400 mr-4 text-2xl" />
                                    Địa điểm tổ chức
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-xl text-blue-200 mb-2">
                                            {event.location?.venueName || 'Chưa xác định địa điểm'}
                                        </h3>
                                        <p className="text-blue-300/80 text-lg">
                                            {event.location?.address}
                                            {event.location?.ward ? `, ${event.location.ward}` : ''}
                                            {event.location?.district ? `, ${event.location.district}` : ''}
                                            {event.location?.city ? `, ${event.location.city}` : ''}
                                            {event.location?.country ? `, ${event.location.country}` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Reviews Section */}
                            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-blue-500/30 p-8">
                                <ReviewSection eventId={id} />
                            </div>
                        </div>

                        {/* Right Column - Booking Info */}
                        <div className="lg:col-span-1">
                            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-blue-500/30 p-8 sticky top-8">
                                {/* Event Category */}
                                <div className="mb-6">
                                    <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-sm font-bold">
                                        {event.category || 'Sự kiện'}
                                    </span>
                                </div>

                                {/* Event Details */}
                                <div className="space-y-6 mb-8">
                                    <div className="flex items-center text-blue-300">
                                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                                            <FaCalendarAlt className="text-blue-400 text-xl" />
                                        </div>
                                        <div>
                                            <p className="text-blue-300/80 text-sm">Ngày diễn ra</p>
                                            <p className="text-blue-200 font-semibold">{formatDate(event.startDate)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-blue-300">
                                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                                            <FaClock className="text-blue-400 text-xl" />
                                        </div>
                                        <div>
                                            <p className="text-blue-300/80 text-sm">Thời gian</p>
                                            <p className="text-blue-200 font-semibold">{formatTime(event.startDate)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-blue-300">
                                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                                            <FaMapMarkerAlt className="text-blue-400 text-xl" />
                                        </div>
                                        <div>
                                            <p className="text-blue-300/80 text-sm">Địa điểm</p>
                                            <p className="text-blue-200 font-semibold line-clamp-2">
                                                {event.location?.venueName || 'Chưa xác định'}
                                            </p>
                                        </div>
                                    </div>

                                    {event.capacity && (
                                        <div className="flex items-center text-blue-300">
                                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                                                <FaUsers className="text-blue-400 text-xl" />
                                            </div>
                                            <div>
                                                <p className="text-blue-300/80 text-sm">Sức chứa</p>
                                                <p className="text-blue-200 font-semibold">{event.capacity} chỗ</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Price */}
                                <div className="mb-8 p-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30">
                                    <p className="text-blue-300/80 text-sm mb-2">Giá vé từ</p>
                                    <p className="text-3xl font-bold text-blue-200">{getMinPrice()}</p>
                                </div>

                                {/* Book Now Button */}
                                <button
                                    onClick={handleBookNow}
                                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center text-lg"
                                >
                                    <FaTicketAlt className="mr-3 text-xl" />
                                    Đặt vé ngay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailPage;