import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaFilter, FaTicketAlt, FaHeart, FaStar, FaUsers, FaFireAlt, FaMoon, FaMagic } from 'react-icons/fa';
import { eventAPI } from '../services/api';
import { toast } from 'react-toastify';

const AllEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [filteredEvents, setFilteredEvents] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const response = await eventAPI.getEvents();
                console.log('Events response:', response);
                
                // Backend trả về { success: true, data: events }
                let eventsData = [];
                if (response && response.success && response.data) {
                    eventsData = response.data;
                } else if (response && Array.isArray(response)) {
                    eventsData = response;
                } else if (response && response.data && Array.isArray(response.data)) {
                    eventsData = response.data;
                }
                
                console.log('Processed events data:', eventsData);
                setEvents(eventsData);
                setFilteredEvents(eventsData);
            } catch (error) {
                console.error("Lỗi khi tải sự kiện:", error);
                toast.error("Không thể tải danh sách sự kiện.");
                setEvents([]);
                setFilteredEvents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    useEffect(() => {
        let filtered = events;

        if (searchTerm) {
            filtered = filtered.filter(event =>
                event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedCategory) {
            filtered = filtered.filter(event => 
                Array.isArray(event.category) 
                    ? event.category.includes(selectedCategory)
                    : event.category === selectedCategory
            );
        }

        if (selectedCity) {
            filtered = filtered.filter(event => 
                event.location?.city?.toLowerCase().includes(selectedCity.toLowerCase())
            );
        }

        setFilteredEvents(filtered);
    }, [events, searchTerm, selectedCategory, selectedCity]);

    // Lấy danh sách categories và cities
    const categories = [...new Set(
        events.flatMap(event => 
            Array.isArray(event.category) ? event.category : [event.category]
        ).filter(Boolean)
    )];
    const cities = [...new Set(events.map(event => event.location?.city).filter(Boolean))];

    // Hàm xử lý hình ảnh sự kiện
    const getEventImage = (event) => {
        // Handle old format: event.images = {logo: "url", banner: "url"}
        if (event.images && typeof event.images === 'object' && !Array.isArray(event.images)) {
            const imageUrl = event.images.banner || event.images.logo;
            if (imageUrl) {
                return imageUrl.startsWith('http') 
                    ? imageUrl 
                    : `http://localhost:5001${imageUrl}`;
            }
        }
        
        // Handle new format: event.images = ["/uploads/events/filename.jpg"]
        if (event.images && Array.isArray(event.images) && event.images.length > 0) {
            const imageUrl = event.images[0];
            return imageUrl.startsWith('http') 
                ? imageUrl 
                : `http://localhost:5001${imageUrl}`;
        }
        
        // Fallback to default image
        return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
    };

    // Helper function to get venue display text
    const getVenueDisplay = (venue) => {
        if (typeof venue === 'string') {
            return venue;
        } else if (venue && typeof venue === 'object') {
            if (venue.venueName) {
                return venue.venueName;
            } else if (venue.address) {
                return venue.address;
            } else if (venue.city) {
                return venue.city;
            }
        }
        return 'Chưa có địa điểm';
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
                    <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-1500"></div>
                </div>

                {/* Hero Section */}
                <div className="relative z-10 bg-gradient-to-b from-transparent via-black/50 to-black text-blue-200 py-20">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 flex items-center justify-center">
                            <FaMoon className="text-blue-400 mr-4 animate-pulse" />
                            <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                                Tất Cả Sự Kiện
                            </span>
                            <FaMagic className="text-blue-400 ml-4 animate-bounce" />
                        </h1>
                        <p className="text-xl text-blue-300 mb-8">
                            ✨ Khám phá những sự kiện tuyệt vời nhất ✨
                        </p>
                    </div>
                </div>

                {/* Loading Content */}
                <div className="relative z-10 container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(id => (
                            <div key={id} className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-blue-500/20 overflow-hidden">
                                <div className="w-full h-64 bg-gradient-to-r from-gray-800 to-gray-700 animate-pulse"></div>
                                <div className="p-4">
                                    <div className="h-5 bg-gray-700 rounded-lg w-3/4 mb-2 animate-pulse"></div>
                                    <div className="h-3 bg-gray-700 rounded-lg w-1/2 mb-2 animate-pulse"></div>
                                    <div className="h-3 bg-gray-700 rounded-lg w-2/3 mb-3 animate-pulse"></div>
                                    <div className="h-8 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg animate-pulse"></div>
                                </div>
                            </div>
                        ))}
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
                <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse delay-750"></div>
            </div>

            {/* Hero Section */}
            <div className="relative z-10 bg-gradient-to-b from-transparent via-black/50 to-black text-blue-200 py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 flex items-center justify-center">
                        <FaMoon className="text-blue-400 mr-4 animate-pulse" />
                        <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                            Tất Cả Sự Kiện
                        </span>
                                                    <FaMagic className="text-blue-400 ml-4 animate-bounce" />
                    </h1>
                    <p className="text-xl text-blue-300 mb-8">
                        ✨ Khám phá những sự kiện tuyệt vời nhất ✨
                    </p>
                    
                    {/* Search and Filter */}
                    <div className="max-w-4xl mx-auto bg-gray-900/30 backdrop-blur-md rounded-2xl p-6 border border-blue-500/30 shadow-2xl">
                        <div className="grid md:grid-cols-4 gap-4">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-3 text-blue-400" />
                                <input
                                    type="text"
                                    placeholder="🔍 Tìm kiếm sự kiện..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800/50 border border-blue-500/30 text-blue-200 placeholder-blue-300/70 focus:bg-gray-800/70 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all duration-300"
                                />
                            </div>

                            <div className="relative">
                                <FaFilter className="absolute left-3 top-3 text-blue-400" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800/50 border border-blue-500/30 text-blue-200 focus:bg-gray-800/70 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all duration-300 appearance-none"
                                >
                                    <option value="" className="text-gray-800">🎭 Tất cả danh mục</option>
                                    {categories.map((category, index) => (
                                        <option key={`category-${index}-${category}`} value={category} className="text-gray-800">
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="relative">
                                <FaMapMarkerAlt className="absolute left-3 top-3 text-blue-400" />
                                <select
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800/50 border border-blue-500/30 text-blue-200 focus:bg-gray-800/70 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all duration-300 appearance-none"
                                >
                                    <option value="" className="text-gray-800">📍 Tất cả thành phố</option>
                                    {cities.map((city, index) => (
                                        <option key={`city-${index}-${city}`} value={city} className="text-gray-800">
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('');
                                    setSelectedCity('');
                                }}
                                className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 font-semibold py-3 px-4 rounded-xl border border-blue-500/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
                            >
                                🗑️ Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Events Content */}
            <div className="relative z-10 container mx-auto px-4 py-12">
                <div className="mb-8 text-center">
                    <p className="text-blue-300 text-lg bg-gray-900/50 backdrop-blur-sm rounded-xl px-6 py-3 border border-blue-500/30 inline-block">
                        🎯 Hiển thị <span className="font-bold text-blue-400">{filteredEvents.length}</span> sự kiện
                        {searchTerm && ` cho "${searchTerm}"`}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map((event, index) => (
                            <motion.div
                                key={event._id}
                                className="group bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-blue-500/20 overflow-hidden hover:border-blue-400/40 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-105"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.6 }}
                            >
                                <Link to={`/events/${event._id}`}>
                                    <div className="relative h-64 md:h-72 lg:h-80 overflow-hidden">
                                        <img
                                            src={getEventImage(event)}
                                            alt={event.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        
                                        {/* Category Badge */}
                                        <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                                            {Array.isArray(event.category) ? event.category[0] : event.category || 'Sự kiện'}
                                        </div>
                                        
                                        {/* Heart Icon */}
                                        <div className="absolute top-3 left-3 w-7 h-7 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <FaHeart className="text-red-400 text-xs" />
                                        </div>
                                    </div>
                                </Link>
                                
                                <div className="p-4">
                                    <h3 className="text-lg font-bold text-blue-200 mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors duration-300">
                                        {event.title}
                                    </h3>
                                    <p className="text-blue-300/80 text-xs mb-3 line-clamp-2">
                                        {event.description}
                                    </p>
                                    
                                    <div className="space-y-1.5 mb-3">
                                        {event.startDate && (
                                            <div className="flex items-center text-blue-300/80 text-xs">
                                                <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center mr-2">
                                                    <FaCalendarAlt className="text-blue-400 text-xs" />
                                                </div>
                                                {new Date(event.startDate).toLocaleDateString('vi-VN', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        )}
                                        {(event.location?.venueName || event.location?.type === 'online') && (
                                            <div className="flex items-center text-blue-300/80 text-xs">
                                                <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center mr-2">
                                                    <FaMapMarkerAlt className="text-blue-400 text-xs" />
                                                </div>
                                                <span className="line-clamp-1">
                                                    {event.location?.type === 'online' 
                                                        ? '🌐 Trực tuyến'
                                                        : event.location?.venueName || 'Địa điểm chưa xác định'
                                                    }
                                                </span>
                                            </div>
                                        )}
                                        {event.capacity && (
                                            <div className="flex items-center text-blue-300/80 text-xs">
                                                <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center mr-2">
                                                    <FaUsers className="text-blue-400 text-xs" />
                                                </div>
                                                {event.capacity} chỗ
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-blue-300 font-bold text-sm">
                                                💰 Từ 0đ
                                            </span>
                                        </div>
                                        <Link
                                            to={`/events/${event._id}`}
                                            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 flex items-center"
                                        >
                                            <FaTicketAlt className="mr-1" /> 
                                            Đặt vé
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16">
                            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-blue-500/30 p-12 max-w-md mx-auto">
                                <div className="text-6xl mb-6">😔</div>
                                <h3 className="text-2xl font-bold text-blue-200 mb-4">Không tìm thấy sự kiện nào</h3>
                                <p className="text-blue-300/80 mb-6">
                                    {searchTerm || selectedCategory || selectedCity
                                        ? 'Hãy thử điều chỉnh các bộ lọc để tìm thấy sự kiện phù hợp.'
                                        : 'Hiện tại chưa có sự kiện nào được tổ chức.'
                                    }
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('');
                                        setSelectedCity('');
                                    }}
                                    className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                                >
                                    🔄 Đặt lại bộ lọc
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Back to Home */}
                <div className="text-center mt-16">
                    <Link
                        to="/"
                        className="inline-flex items-center bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-blue-200 font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transform hover:scale-105 border border-blue-500/30"
                    >
                        🏠 Quay về trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AllEvents; 