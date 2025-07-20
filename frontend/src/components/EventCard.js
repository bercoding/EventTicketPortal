import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const EventCard = ({ event, size = 'normal', className = '' }) => {
    const navigate = useNavigate();

    // Helper functions
    const safeFormatDate = (dateString) => {
        if (!dateString) return 'Ngày sẽ được cập nhật';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Ngày sẽ được cập nhật';
            return date.toLocaleDateString('vi-VN', { 
                weekday: size === 'large' ? 'long' : 'short',
                day: '2-digit', 
                month: '2-digit', 
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
        const maxPrice = prices[prices.length - 1];
        
        if (minPrice === maxPrice) {
            return `${minPrice.toLocaleString('vi-VN')}đ`;
        } else {
            return `${minPrice.toLocaleString('vi-VN')}đ - ${maxPrice.toLocaleString('vi-VN')}đ`;
        }
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

    // Size configurations
    const sizeConfig = {
        normal: {
            container: 'w-full max-w-sm',
            image: 'h-48 sm:h-56',
            title: 'text-lg sm:text-xl',
            content: 'p-5 space-y-4',
            button: 'py-3'
        },
        large: {
            container: 'w-full max-w-md lg:max-w-lg',
            image: 'h-64 sm:h-72 lg:h-80',
            title: 'text-xl sm:text-2xl lg:text-3xl',
            content: 'p-6 space-y-5',
            button: 'py-4'
        }
    };

    const config = sizeConfig[size];
    const category = getCategoryBadge();

    return (
        <div className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-gray-100 ${config.container} ${className} group`}>
            {/* Image Container */}
            <div className={`relative w-full ${config.image} overflow-hidden`}>
                <img
                    src={getEventImage()}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                        e.target.src = '/images/placeholder-event.svg';
                    }}
                />
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                    <div className={`${category.color} text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 backdrop-blur-sm bg-opacity-90`}>
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                    </div>
                </div>

                {/* Featured Badge if applicable */}
                {event.featured && (
                    <div className="absolute top-4 right-4">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                            <span>⭐</span>
                            <span>Nổi bật</span>
                        </div>
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                
                {/* Quick view button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Link 
                        to={`/events/${event._id}`}
                        className="bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold transform scale-95 hover:scale-100 transition-all duration-200 shadow-lg"
                    >
                        Xem chi tiết
                    </Link>
                </div>
            </div>

            {/* Content Container */}
            <div className={config.content}>
                {/* Event Title */}
                <h3 className={`${config.title} font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors duration-300`}>
                    {event.title}
                </h3>

                {/* Date and Time */}
                <div className="flex items-center space-x-2 text-gray-600">
                    <div className="flex items-center space-x-2 flex-1">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800">{safeFormatDate(event.startDate)}</span>
                            {formatTime(event.startDate) && (
                                <span className="text-xs text-gray-500">{formatTime(event.startDate)}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Location */}
                {event.venue && (
                    <div className="flex items-center space-x-2 text-gray-600">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm line-clamp-1 font-medium">
                            {typeof event.venue === 'string' 
                                ? event.venue 
                                : event.venue?.venueName || event.venue?.address || 'Địa điểm sẽ được cập nhật'
                            }
                        </span>
                    </div>
                )}

                {/* Description for large cards */}
                {size === 'large' && event.description && (
                    <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                        {event.description}
                    </p>
                )}

                {/* Price */}
                <div className="pt-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline space-x-1">
                            <span className="text-sm text-gray-500 font-medium">Từ</span>
                            <span className={`${size === 'large' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent`}>
                                {safeGetPrice(event.ticketTypes)}
                            </span>
                        </div>
                        
                        {/* Availability indicator */}
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-600 font-medium">Còn vé</span>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleBooking}
                    className={`w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold ${config.button} px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl relative overflow-hidden group/btn`}
                >
                    {/* Button shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                    
                    <span className="flex items-center justify-center space-x-2 relative z-10">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <span>Đặt vé ngay</span>
                    </span>
                </button>
            </div>
        </div>
    );
};

export default EventCard; 