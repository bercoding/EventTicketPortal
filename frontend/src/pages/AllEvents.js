import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaFilter, FaTicketAlt, FaHeart, FaStar, FaUsers, FaFireAlt } from 'react-icons/fa';
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
            return event.images.banner || event.images.logo || 'https://via.placeholder.com/400x250/6366f1/ffffff?text=Event+Logo';
        }
        
        // Handle new format: event.images = ["/uploads/events/filename.jpg"]
        if (!event.images || !Array.isArray(event.images) || event.images.length === 0) {
            return 'https://via.placeholder.com/400x250/6366f1/ffffff?text=Event+Logo';
        }
        return `http://localhost:5001${event.images[0]}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-16">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-4 flex items-center justify-center">
                            <FaFireAlt className="text-orange-400 mr-3 animate-pulse" />
                            Tất Cả Sự Kiện
                            <FaStar className="text-yellow-400 ml-3 animate-bounce" />
                        </h1>
                        <p className="text-xl text-blue-100">
                            🎉 Khám phá những sự kiện tuyệt vời nhất 🎉
                        </p>
                    </div>
                </div>

                {/* Loading Content */}
                <div className="container mx-auto px-4 py-12">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(id => (
                            <div key={id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                                <div className="w-full h-48 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
                                <div className="p-6">
                                    <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-3 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded-lg w-1/2 mb-2 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded-lg w-2/3 mb-4 animate-pulse"></div>
                                    <div className="h-10 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 flex items-center justify-center">
                        <FaFireAlt className="text-orange-400 mr-3 animate-pulse" />
                        Tất Cả Sự Kiện
                        <FaStar className="text-yellow-400 ml-3 animate-bounce" />
                    </h1>
                    <p className="text-xl text-blue-100 mb-8">
                        🎉 Khám phá những sự kiện tuyệt vời nhất 🎉
                    </p>
                    
                    {/* Search and Filter */}
                    <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <div className="grid md:grid-cols-4 gap-4">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-3 text-white/70" />
                                <input
                                    type="text"
                                    placeholder="🔍 Tìm kiếm sự kiện..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/70 focus:bg-white/30 focus:ring-2 focus:ring-white/50 transition-all duration-300"
                                />
                            </div>

                            <div className="relative">
                                <FaFilter className="absolute left-3 top-3 text-white/70" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white focus:bg-white/30 focus:ring-2 focus:ring-white/50 transition-all duration-300 appearance-none"
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
                                <FaMapMarkerAlt className="absolute left-3 top-3 text-white/70" />
                                <select
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white focus:bg-white/30 focus:ring-2 focus:ring-white/50 transition-all duration-300 appearance-none"
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
                                className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-4 rounded-xl border border-white/30 transition-all duration-300 hover:scale-105"
                            >
                                🗑️ Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Events Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="mb-8 text-center">
                    <p className="text-gray-600 text-lg bg-white rounded-xl px-6 py-3 shadow-md inline-block">
                        🎯 Hiển thị <span className="font-bold text-purple-600">{filteredEvents.length}</span> sự kiện
                        {searchTerm && ` cho "${searchTerm}"`}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map((event, index) => (
                            <motion.div
                                key={event._id}
                                className="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.6 }}
                            >
                                <Link to={`/events/${event._id}`}>
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={getEventImage(event)}
                                            alt={event.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/400x250/6366f1/ffffff?text=Event+Logo';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        
                                        {/* Category Badge */}
                                        <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                            {Array.isArray(event.category) ? event.category[0] : event.category || 'Sự kiện'}
                                        </div>
                                        
                                        {/* Heart Icon */}
                                        <div className="absolute top-3 left-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <FaHeart className="text-red-400 text-sm" />
                                        </div>
                                    </div>
                                </Link>
                                
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors duration-300">
                                        {event.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {event.description}
                                    </p>
                                    
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center text-gray-600 text-sm">
                                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                <FaCalendarAlt className="text-blue-500 text-xs" />
                                            </div>
                                            {new Date(event.startDate).toLocaleDateString('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })}
                                        </div>
                                        <div className="flex items-center text-gray-600 text-sm">
                                            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                                <FaMapMarkerAlt className="text-red-500 text-xs" />
                                            </div>
                                            <span className="line-clamp-1">
                                                {event.location?.type === 'offline' 
                                                    ? (event.location?.venueName || event.location?.city || 'Không rõ địa điểm')
                                                    : '🌐 Trực tuyến'
                                                }
                                            </span>
                                        </div>
                                        {event.capacity && (
                                            <div className="flex items-center text-gray-600 text-sm">
                                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                                    <FaUsers className="text-green-500 text-xs" />
                                                </div>
                                                {event.capacity} chỗ
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-purple-600 font-bold text-lg">
                                                💰 Từ 0đ
                                            </span>
                                        </div>
                                        <Link
                                            to={`/events/${event._id}`}
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-xl text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                                        >
                                            <FaTicketAlt className="mr-2" /> 
                                            Đặt vé
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16">
                            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto">
                                <div className="text-6xl mb-6">😔</div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy sự kiện nào</h3>
                                <p className="text-gray-600 mb-6">
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
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
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
                        className="inline-flex items-center bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        🏠 Quay về trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AllEvents; 