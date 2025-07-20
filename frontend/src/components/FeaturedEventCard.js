import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaMapPin, FaUsers, FaStar, FaHeart } from 'react-icons/fa';

const FeaturedEventCard = ({ event }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 overflow-hidden">
            {/* Image Section */}
            <div className="relative h-64 overflow-hidden">
                <img
                    src={event.image || event.images?.[0] || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Overlay with gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                    <span className="bg-pastel-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {event.category || 'Sự kiện'}
                    </span>
                </div>

                {/* Favorite Button */}
                <button className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-all duration-300">
                    <FaHeart className="text-lg" />
                </button>

                {/* Rating */}
                <div className="absolute bottom-4 right-4 flex items-center bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-sm">
                    <FaStar className="text-yellow-400 mr-1" />
                    <span>4.8</span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6">
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-pastel-600 transition-colors">
                    {event.title}
                </h3>

                {/* Event Details */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600">
                        <FaCalendarAlt className="text-pastel-500 mr-2" />
                        <span className="text-sm">{formatDate(event.date)}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                        <FaClock className="text-pastel-500 mr-2" />
                        <span className="text-sm">{formatTime(event.date)}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                        <FaMapPin className="text-pastel-500 mr-2" />
                        <span className="text-sm">{event.venue || event.location || 'Địa điểm TBA'}</span>
                    </div>
                    
                    {event.capacity && (
                        <div className="flex items-center text-gray-600">
                            <FaUsers className="text-pastel-500 mr-2" />
                            <span className="text-sm">Tối đa {event.capacity} người</span>
                        </div>
                    )}
                </div>

                {/* Price and Action */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="text-2xl font-bold text-pastel-600">
                            {event.price ? `${event.price.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                        </span>
                        {event.originalPrice && event.originalPrice > event.price && (
                            <span className="text-gray-400 line-through ml-2 text-sm">
                                {event.originalPrice.toLocaleString('vi-VN')}đ
                            </span>
                        )}
                    </div>
                    
                    <Link
                        to={`/events/${event._id}`}
                        className="bg-gradient-to-r from-pastel-500 to-pastel-600 text-white px-6 py-2 rounded-xl font-medium hover:from-pastel-600 hover:to-pastel-700 transition-all duration-300 transform hover:scale-105"
                    >
                        Chi tiết
                    </Link>
                </div>

                {/* Status Badge */}
                {event.status && (
                    <div className="mt-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            event.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                            event.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                            event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                            {event.status === 'upcoming' ? 'Sắp diễn ra' :
                             event.status === 'ongoing' ? 'Đang diễn ra' :
                             event.status === 'completed' ? 'Đã kết thúc' :
                             'Chờ xác nhận'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeaturedEventCard; 