import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTicketAlt, FaStar } from 'react-icons/fa';

const EventCard = ({ event, size = 'normal', className = '' }) => {
    const navigate = useNavigate();

    // Helper functions
    const safeFormatDate = (dateString) => {
        if (!dateString) return 'Ngày sẽ được cập nhật';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Ngày sẽ được cập nhật';
            return date.toLocaleDateString('vi-VN', { 
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric' 
            });
        } catch (e) {
            return 'Ngày sẽ được cập nhật';
        }
    };

    const safeFormatFullDate = (dateString) => {
        if (!dateString) return 'Ngày sẽ được cập nhật';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Ngày sẽ được cập nhật';
            return date.toLocaleDateString('vi-VN', { 
                day: '2-digit',
                month: 'long', 
                year: 'numeric' 
            });
        } catch (e) {
            return 'Ngày sẽ được cập nhật';
        }
    };

    const safeGetPrice = (ticketTypes) => {
        if (!ticketTypes || !Array.isArray(ticketTypes) || ticketTypes.length === 0) {
            return 'Liên hệ';
        }
        
        const prices = ticketTypes
            .map(tt => tt.price)
            .filter(price => typeof price === 'number' && price > 0)
            .sort((a, b) => a - b);
        
        if (prices.length === 0) return 'Liên hệ';
        
        const minPrice = prices[0];
        return `Từ ${minPrice.toLocaleString('vi-VN')}₫`;
    };

    const handleBooking = () => {
        if (event.seatingMap) {
            navigate(`/events/${event._id}/select-seats`);
        } else {
            navigate(`/simple-booking/${event._id}`);
        }
    };

    const getEventImage = () => {
        // Handle old format: event.images = {logo: "url", banner: "url"}
        if (event.images && typeof event.images === 'object' && !Array.isArray(event.images)) {
            // Kiểm tra nếu URL đã có http hoặc https, hoặc bắt đầu bằng /uploads
            const bannerUrl = event.images.banner || '';
            const logoUrl = event.images.logo || '';
            
            // Ưu tiên sử dụng banner, nếu không có thì dùng logo
            let imageUrl = bannerUrl || logoUrl;
            
            if (!imageUrl) return '/images/placeholder-event.svg';
            
            // Kiểm tra nếu URL không bắt đầu bằng http/https và không phải đường dẫn tuyệt đối
            if (!imageUrl.startsWith('http') && !imageUrl.startsWith('https')) {
                // Nếu URL bắt đầu bằng /uploads thì thêm tiền tố
                if (imageUrl.startsWith('/uploads')) {
                    return `http://localhost:5001${imageUrl}`;
                }
            }
            return imageUrl;
        }
        
        // Handle new format: event.images = ["/uploads/events/filename.jpg"]
        if (!event.images || !Array.isArray(event.images) || event.images.length === 0) {
            return '/images/placeholder-event.svg';
        }
        
        const imageUrl = event.images[0];
        // Kiểm tra nếu URL không bắt đầu bằng http/https và không phải đường dẫn tuyệt đối
        if (!imageUrl.startsWith('http') && !imageUrl.startsWith('https')) {
            // Nếu URL bắt đầu bằng /uploads thì thêm tiền tố
            if (imageUrl.startsWith('/uploads')) {
                return `http://localhost:5001${imageUrl}`;
            }
        }
        return imageUrl;
    };

    const getCategoryBadge = () => {
        const categoryMap = {
            'music': { name: 'Âm nhạc', color: 'bg-pink-500', icon: '🎵' },
            'sport': { name: 'Thể thao', color: 'bg-orange-500', icon: '⚽' },
            'theater': { name: 'Sân khấu', color: 'bg-purple-500', icon: '🎭' },
            'conference': { name: 'Hội thảo', color: 'bg-blue-500', icon: '💼' },
            'festival': { name: 'Lễ hội', color: 'bg-green-500', icon: '🎪' },
            'workshop': { name: 'Workshop', color: 'bg-indigo-500', icon: '🔧' },
            'other': { name: 'Khác', color: 'bg-gray-500', icon: '🎫' }
        };
        
        const category = categoryMap[event.category] || categoryMap['other'];
        return category;
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        } catch (e) {
            return '';
        }
    };

    const formatTimeRange = (startDate, endDate) => {
        if (!startDate || !endDate) return '';
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const startTime = start.toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
            const endTime = end.toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
            return `${startTime}-${endTime}`;
        } catch (e) {
            return '';
        }
    };

    // Size configurations
    const sizeConfig = {
        normal: {
            container: 'w-full max-w-sm',
            image: 'h-48',
            title: 'text-lg',
            content: 'p-4',
            button: 'py-2'
        },
        large: {
            container: 'w-full max-w-md',
            image: 'h-56',
            title: 'text-xl',
            content: 'p-5',
            button: 'py-3'
        }
    };

    const config = sizeConfig[size];
    const category = getCategoryBadge();

    return (
        <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100 ${config.container} ${className} group`}>
            {/* Image Container */}
            <div className={`relative w-full ${config.image} overflow-hidden`}>
                <img
                    src={getEventImage()}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                        e.target.src = '/images/placeholder-event.svg';
                    }}
                />
                
                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                    <div className={`${category.color} text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 backdrop-blur-sm bg-opacity-90`}>
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                    </div>
                </div>

                {/* Featured Badge if applicable */}
                {event.featured && (
                    <div className="absolute top-3 right-3">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                            <FaStar className="text-xs" />
                            <span>Nổi bật</span>
                        </div>
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className={config.content}>
                {/* Event Title */}
                <h3 className={`${config.title} font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-pastel-600 transition-colors duration-300 mb-3`}>
                    {event.title}
                </h3>

                {/* Date and Time */}
                <div className="space-y-2 mb-3">
                    {event.startDate && (
                        <div className="flex items-center text-gray-600">
                            <FaCalendarAlt className="w-4 h-4 text-pastel-500 mr-2 flex-shrink-0" />
                            <span className="text-sm">{safeFormatFullDate(event.startDate)}</span>
                        </div>
                    )}
                    
                    {event.startDate && event.endDate && (
                        <div className="flex items-center text-gray-600">
                            <FaClock className="w-4 h-4 text-pastel-500 mr-2 flex-shrink-0" />
                            <span className="text-sm">{formatTimeRange(event.startDate, event.endDate)}</span>
                        </div>
                    )}
                    
                    {(event.venue || event.location?.venueName) && (
                        <div className="flex items-center text-gray-600">
                            <FaMapMarkerAlt className="w-4 h-4 text-pastel-500 mr-2 flex-shrink-0" />
                            <span className="text-sm line-clamp-1">
                                {event.location?.type === 'online' 
                                    ? 'Sự kiện online' 
                                    : event.location?.venueName || event.venue || 'Địa điểm chưa xác định'
                                }
                            </span>
                        </div>
                    )}
                </div>

                {/* Price and Action */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center">
                        <FaTicketAlt className="w-4 h-4 text-pastel-500 mr-2" />
                        <span className="text-lg font-bold text-pastel-600">
                            {safeGetPrice(event.ticketTypes)}
                        </span>
                    </div>
                    
                    <Link
                        to={`/events/${event._id}`}
                        className="bg-gradient-to-r from-pastel-500 to-pastel-600 text-white px-4 py-2 rounded-lg font-medium hover:from-pastel-600 hover:to-pastel-700 transition-all duration-300 transform hover:scale-105 text-sm"
                    >
                        Chi tiết
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default EventCard; 