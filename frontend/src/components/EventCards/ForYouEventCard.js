import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ForYouEventCard = ({ event, className = '' }) => {
    const navigate = useNavigate();

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
        return `Từ ${minPrice.toLocaleString('vi-VN')}đ`;
    };

    const getEventImage = () => {
        // Handle old format: event.images = {logo: "url", banner: "url"}
        if (event.images && typeof event.images === 'object' && !Array.isArray(event.images)) {
            return event.images.banner || event.images.logo || '/images/placeholder-event.svg';
        }
        
        // Handle new format: event.images = ["/uploads/events/filename.jpg"]
        if (!event.images || !Array.isArray(event.images) || event.images.length === 0) {
            return '/images/placeholder-event.svg';
        }
        return `https://eventbackendacr-c4dhdsbhfug2hkb2.australiacentral-01.azurewebsites.net/${event.images[0]}`;
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

    const handleBooking = () => {
        if (event.seatingMap) {
            navigate(`/events/${event._id}/select-seats`);
        } else {
            navigate(`/simple-booking/${event._id}`);
        }
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

    const category = getCategoryBadge();

    return (
        <div className={`bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${className} h-40 flex`}>
            {/* Event Image */}
            <div className="relative w-60 h-full overflow-hidden flex-shrink-0">
                <img
                    src={getEventImage()}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                        e.target.src = '/images/placeholder-event.svg';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10"></div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                    {/* Event Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                        {event.title}
                    </h3>

                    {/* Date and Location */}
                    <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">
                                {safeFormatDate(event.startDate)}
                                {formatTime(event.startDate) && ` • ${formatTime(event.startDate)}`}
                            </span>
                        </div>
                        
                        {event.venue && (
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="line-clamp-1">
                                    {typeof event.venue === 'string' 
                                        ? event.venue 
                                        : event.venue?.venueName || event.venue?.address || 'Địa điểm sẽ được cập nhật'
                                    }
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Section with Price and Action */}
                <div className="flex items-center justify-between pt-2">
                    <div>
                        <div className="text-blue-600 text-lg font-bold">
                            {safeGetPrice(event.ticketTypes)}
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <Link 
                            to={`/events/${event._id}`}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            Chi tiết
                        </Link>
                        <button 
                            onClick={handleBooking}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors duration-200"
                        >
                            Đặt vé
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForYouEventCard; 