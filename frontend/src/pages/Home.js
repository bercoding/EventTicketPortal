import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaMusic, FaFootballBall, FaTheaterMasks, FaUsers, FaStar, FaChartLine, FaFireAlt } from 'react-icons/fa';
import EventCard from '../components/EventCard';
import { eventAPI } from '../services/api';

const Home = () => {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await eventAPI.getEvents();
            console.log('Home events response:', response);
            
            // Backend trả về { success: true, events: [...], data: [...] }
            let eventsData = [];
            if (response && response.success && (response.events || response.data)) {
                eventsData = response.events || response.data;
            } else if (response && Array.isArray(response)) {
                eventsData = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                eventsData = response.data;
            }
            
            setEvents(eventsData);
        } catch (err) {
            setError('Không thể tải danh sách sự kiện');
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Đang tải sự kiện...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
                <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <p className="text-xl font-semibold text-gray-800 mb-4">{error}</p>
                    <button
                        onClick={fetchEvents}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const categoryIcons = {
        'Âm nhạc': FaMusic,
        'Thể thao': FaFootballBall,
        'Sân khấu': FaTheaterMasks,
        'Hội nghị': FaUsers
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Simplified Hero Section */}
            <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-16 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent transform -skew-y-6"></div>
                </div>
                
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="flex justify-center items-center mb-6">
                        <FaFireAlt className="text-orange-400 text-4xl mr-3 animate-pulse" />
                        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                            EventHub
                        </h1>
                        <FaStar className="text-yellow-400 text-4xl ml-3 animate-bounce" />
                    </div>
                    <p className="text-xl md:text-2xl text-blue-100 mb-4">
                        🎉 Khám phá những sự kiện tuyệt vời nhất 🎉
                    </p>
                    <p className="text-lg text-blue-200 max-w-2xl mx-auto mb-8">
                        Tìm kiếm, đặt vé và tham gia các sự kiện hấp dẫn từ âm nhạc, thể thao đến hội nghị chuyên nghiệp
                    </p>
                    <Link
                        to="/events"
                        className="inline-block bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        🎯 Khám phá sự kiện
                    </Link>
                </div>
            </div>

            {/* Featured Events Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h2 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
                            <FaChartLine className="text-orange-500 mr-3" />
                            Sự kiện nổi bật
                        </h2>
                        <p className="text-gray-600 text-lg">Những sự kiện được yêu thích nhất</p>
                    </div>
                    <Link
                        to="/events"
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        Xem tất cả →
                    </Link>
                </div>

                {/* Events Grid - Improved responsive layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                    {events.slice(0, 8).map((event) => (
                        <div key={event._id} className="flex justify-center">
                            <EventCard event={event} />
                        </div>
                    ))}
                </div>

                {events.length === 0 && !loading && (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">😔</div>
                        <p className="text-gray-500 text-xl mb-4">
                            Chưa có sự kiện nào được tạo
                        </p>
                        <p className="text-gray-400">
                            Hãy quay lại sau để khám phá những sự kiện thú vị!
                        </p>
                    </div>
                )}
            </div>

            {/* Enhanced Categories Section */}
            <div className="bg-white py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-800 mb-4">
                            🎯 Khám phá theo thể loại
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            Tìm kiếm sự kiện phù hợp với sở thích của bạn
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {['Âm nhạc', 'Thể thao', 'Sân khấu', 'Hội nghị'].map((category, index) => {
                            const IconComponent = categoryIcons[category];
                            const colors = [
                                'from-pink-500 to-rose-500',
                                'from-blue-500 to-cyan-500', 
                                'from-purple-500 to-indigo-500',
                                'from-green-500 to-emerald-500'
                            ];
                            return (
                                <div
                                    key={category}
                                    className={`bg-gradient-to-br ${colors[index]} text-white rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105`}
                                >
                                    <IconComponent className="text-4xl mb-4 mx-auto" />
                                    <h3 className="text-xl font-bold mb-2">
                                        {category}
                                    </h3>
                                    <p className="text-white/80 text-sm">
                                        Khám phá {category.toLowerCase()}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Enhanced CTA Section */}
            {!user && (
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-20">
                    <div className="container mx-auto px-4 text-center">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">
                                🚀 Bạn muốn tổ chức sự kiện?
                            </h2>
                            <p className="text-xl md:text-2xl text-blue-100 mb-12">
                                Tham gia cộng đồng và bắt đầu bán vé cho sự kiện của bạn ngay hôm nay!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/register"
                                    className="inline-block bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    🎉 Đăng ký ngay
                                </Link>
                                <Link
                                    to="/login"
                                    className="inline-block bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    🔑 Đăng nhập
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home; 