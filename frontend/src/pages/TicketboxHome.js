import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import EventCard from '../components/EventCard';
import { SpecialEventCard, TrendingEventCard, ForYouEventCard } from '../components/EventCards';
import './TicketboxHome.css';

const TicketboxHome = () => {
    const [featuredEvents, setFeaturedEvents] = useState([]);
    const [specialEvents, setSpecialEvents] = useState([]);
    const [trendingEvents, setTrendingEvents] = useState([]);
    const [forYouEvents, setForYouEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');

    const categories = [
        { id: 'all', name: 'Tất cả', icon: '🎯' },
        { id: 'music', name: 'Âm nhạc', icon: '🎵' },
        { id: 'theater', name: 'Sân khấu', icon: '🎭' },
        { id: 'sport', name: 'Thể thao', icon: '⚽' },
        { id: 'conference', name: 'Hội thảo', icon: '🎤' },
        { id: 'festival', name: 'Lễ hội', icon: '🎪' }
    ];

    useEffect(() => {
        fetchAllEvents();
    }, [activeCategory]);

    const fetchAllEvents = async () => {
        try {
            setLoading(true);
            
            // Fetch different types of events in parallel
            const [featuredRes, specialRes, trendingRes, regularRes] = await Promise.all([
                fetch('http://localhost:5001/api/events?featured=true&limit=6'),
                fetch('http://localhost:5001/api/events?special=true&limit=8'),
                fetch('http://localhost:5001/api/events?trending=true&limit=8'),
                fetch(`http://localhost:5001/api/events?${activeCategory !== 'all' ? `category=${activeCategory}&` : ''}limit=8`)
            ]);

            const [featuredData, specialData, trendingData, regularData] = await Promise.all([
                featuredRes.json(),
                specialRes.json(),
                trendingRes.json(),
                regularRes.json()
            ]);

            if (featuredData.success) {
                setFeaturedEvents(featuredData.events || featuredData.data || []);
            }
            
            if (specialData.success) {
                setSpecialEvents(specialData.events || specialData.data || []);
            }
            
            if (trendingData.success) {
                setTrendingEvents(trendingData.events || trendingData.data || []);
            }
            
            if (regularData.success) {
                setForYouEvents(regularData.events || regularData.data || []);
            }

        } catch (error) {
            console.error('Lỗi khi tải sự kiện:', error);
            
            // Fallback to regular API if special endpoints fail
            try {
                const response = await fetch('http://localhost:5001/api/events');
                const data = await response.json();
                
                if (data.success && data.events) {
                    const events = data.events;
                    setFeaturedEvents(events.slice(0, 6));
                    setSpecialEvents(events.slice(0, 8));
                    setTrendingEvents(events.slice(6, 14));
                    setForYouEvents(events.slice(8, 16));
                }
            } catch (fallbackError) {
                console.error('Fallback API cũng thất bại:', fallbackError);
            }
        } finally {
            setLoading(false);
        }
    };

    const LoadingCard = () => (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
            <div className="w-full h-56 bg-gray-300"></div>
            <div className="p-5 space-y-4">
                <div className="h-6 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-10 bg-gray-300 rounded"></div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Loading Hero */}
                <section className="hero-banner">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="text-center mb-12">
                            <div className="h-16 bg-white/20 rounded-lg mb-6 animate-pulse"></div>
                            <div className="h-6 bg-white/20 rounded-lg max-w-2xl mx-auto animate-pulse"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <LoadingCard key={i} />
                            ))}
                        </div>
                    </div>
                </section>
                
                {/* Loading Categories */}
                <section className="category-nav">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex justify-center">
                            <div className="flex space-x-4">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="w-20 h-20 bg-gray-300 rounded-full animate-pulse"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Banner with Featured Events */}
            <section className="hero-banner">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            Khám phá sự kiện
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">
                                {" "}tuyệt vời
                            </span>
                        </h1>
                        <p className="text-xl text-gray-200 max-w-2xl mx-auto">
                            Tìm kiếm và đặt vé cho những sự kiện hấp dẫn nhất tại Việt Nam
                        </p>
                    </div>

                    {/* Featured Events Slider */}
                    {featuredEvents.length > 0 ? (
                        <div className="featured-slider">
                            <Swiper
                                modules={[Navigation, Pagination, Autoplay]}
                                spaceBetween={20}
                                slidesPerView={1}
                                breakpoints={{
                                    640: { slidesPerView: 2 },
                                    1024: { slidesPerView: 3 }
                                }}
                                navigation
                                pagination={{ clickable: true }}
                                autoplay={{ delay: 4000, disableOnInteraction: false }}
                                className="featured-swiper"
                            >
                                {featuredEvents.map((event) => (
                                    <SwiperSlide key={event._id}>
                                        <EventCard event={event} size="large" />
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    ) : (
                        <div className="text-center text-white/80">
                            <p>Chưa có sự kiện nổi bật nào được thiết lập</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Category Navigation */}
            <section className="category-nav">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-center">
                        <div className="category-buttons">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                                >
                                    <span className="category-icon">{category.icon}</span>
                                    <span className="category-name">{category.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Event Sections */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {/* Special Events */}
                {specialEvents.length > 0 && (
                    <section className="mb-16">
                        <div className="section-header">
                            <h2 className="section-title">
                                <span className="flex items-center space-x-2">
                                    <span className="text-2xl">🔥</span>
                                    <span>Sự kiện đặc biệt</span>
                                </span>
                            </h2>
                            <Link to="/events?special=true" className="view-all-btn">
                                Xem tất cả →
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {specialEvents.map((event) => (
                                <SpecialEventCard key={event._id} event={event} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Trending Events */}
                {trendingEvents.length > 0 && (
                    <section className="mb-16">
                        <div className="section-header">
                            <h2 className="section-title">
                                <span className="flex items-center space-x-2">
                                    <span className="text-2xl">📈</span>
                                    <span>Sự kiện xu hướng</span>
                                </span>
                            </h2>
                            <Link to="/events?trending=true" className="view-all-btn">
                                Xem tất cả →
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {trendingEvents.map((event, index) => (
                                <TrendingEventCard key={event._id} event={event} index={index} />
                            ))}
                        </div>
                    </section>
                )}

                {/* For You Events */}
                <section className="mb-16">
                    <div className="section-header">
                        <h2 className="section-title">
                            <span className="flex items-center space-x-2">
                                <span className="text-2xl">✨</span>
                                <span>
                                    {activeCategory === 'all' ? 'Dành cho bạn' : `Sự kiện ${categories.find(c => c.id === activeCategory)?.name}`}
                                </span>
                            </span>
                        </h2>
                        <Link to={`/events${activeCategory !== 'all' ? `?category=${activeCategory}` : ''}`} className="view-all-btn">
                            Xem tất cả →
                        </Link>
                    </div>
                    {forYouEvents.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {forYouEvents.map((event) => (
                                <ForYouEventCard key={event._id} event={event} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <div className="text-4xl mb-4">🎭</div>
                            <p>Chưa có sự kiện nào trong danh mục này</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default TicketboxHome; 