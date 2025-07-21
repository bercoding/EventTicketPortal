import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    FaMusic, FaFootballBall, FaTheaterMasks, FaUsers, FaStar, FaChartLine, FaFireAlt, 
    FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaFacebook, FaTwitter, FaInstagram, 
    FaYoutube, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt, FaHeart, FaTicketAlt,
    FaCalendarAlt, FaClock, FaMapPin, FaUsers as FaUsersIcon, FaGlobe, FaShieldAlt,
    FaHeadset, FaCreditCard, FaTruck, FaAward
} from 'react-icons/fa';
import EventCard from '../components/EventCard';
import FeaturedEventCard from '../components/FeaturedEventCard';
import { eventAPI } from '../services/api';

const Home = () => {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isVideoMuted, setIsVideoMuted] = useState(true);
    const [isVideoPlaying, setIsVideoPlaying] = useState(true);
    const [videoError, setVideoError] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await eventAPI.getEvents();
            console.log('Home events response:', response);
            
            let eventsData = [];
            
            // Handle different response formats
            if (response && response.success && response.data && Array.isArray(response.data)) {
                // Format: {success: true, data: [...]}
                eventsData = response.data;
            } else if (response && response.success && response.events && Array.isArray(response.events)) {
                // Format: {success: true, events: [...]}
                eventsData = response.events;
            } else if (response && Array.isArray(response)) {
                // Format: [...] (direct array)
                eventsData = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                // Format: {data: [...]}
                eventsData = response.data;
            }
            
            // Filter out events without proper data
            eventsData = eventsData.filter(event => 
                event && event.title && 
                (event.startDate || event.location || event.ticketTypes)
            );
            
            console.log('Filtered events data:', eventsData);
            setEvents(eventsData);
        } catch (err) {
            setError('Không thể tải danh sách sự kiện');
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleVideoMute = () => {
        setIsVideoMuted(!isVideoMuted);
        if (videoRef.current) {
            videoRef.current.muted = !isVideoMuted;
        }
    };

    const toggleVideoPlay = () => {
        setIsVideoPlaying(!isVideoPlaying);
        if (videoRef.current) {
            if (isVideoPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
    };

    const handleVideoError = () => {
        setVideoError(true);
    };

    // Dữ liệu hình ảnh sự kiện mẫu
    const eventImages = [
        {
            id: 1,
            title: "Concert Sơn Tùng M-TP",
            image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            category: "Âm nhạc",
            location: "Hà Nội"
        },
        {
            id: 2,
            title: "Festival Huế 2024",
            image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            category: "Lễ hội",
            location: "Huế"
        },
        {
            id: 3,
            title: "UEFA Champions League",
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            category: "Thể thao",
            location: "Quốc tế"
        },
        {
            id: 4,
            title: "Kịch Romeo & Juliet",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            category: "Sân khấu",
            location: "TP.HCM"
        },
        {
            id: 5,
            title: "Tech Summit 2024",
            image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            category: "Hội nghị",
            location: "Hà Nội"
        },
        {
            id: 6,
            title: "Coachella Festival",
            image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            category: "Âm nhạc",
            location: "California"
        }
    ];

    // Dữ liệu sự kiện mẫu nổi bật
    const featuredEvents = [
        {
            _id: '1',
            title: 'Concert Sơn Tùng M-TP - Sky Tour 2024',
            date: '2024-12-25T19:00:00',
            venue: 'Sân vận động Mỹ Đình, Hà Nội',
            category: 'Âm nhạc',
            price: 500000,
            originalPrice: 800000,
            capacity: 40000,
            status: 'upcoming',
            image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        },
        {
            _id: '2',
            title: 'Festival Huế 2024 - Di sản văn hóa',
            date: '2024-11-15T18:00:00',
            venue: 'Đại Nội Huế, Thừa Thiên Huế',
            category: 'Lễ hội',
            price: 200000,
            capacity: 15000,
            status: 'upcoming',
            image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        },
        {
            _id: '3',
            title: 'UEFA Champions League Final 2024',
            date: '2024-06-01T20:00:00',
            venue: 'Wembley Stadium, London',
            category: 'Thể thao',
            price: 2500000,
            capacity: 90000,
            status: 'upcoming',
            image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        },
        {
            _id: '4',
            title: 'Kịch Romeo & Juliet - Phiên bản hiện đại',
            date: '2024-10-20T19:30:00',
            venue: 'Nhà hát TP.HCM',
            category: 'Sân khấu',
            price: 300000,
            capacity: 1000,
            status: 'upcoming',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pastel-50 to-pastel-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pastel-500 mx-auto mb-4"></div>
                    <p className="text-pastel-700 text-lg">Đang tải sự kiện...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pastel-50 to-pastel-100 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <p className="text-xl font-semibold text-gray-800 mb-4">{error}</p>
                    <button
                        onClick={fetchEvents}
                        className="px-6 py-3 bg-gradient-to-r from-pastel-500 to-pastel-600 text-white rounded-lg hover:from-pastel-600 hover:to-pastel-700 transition-all duration-300 shadow-lg"
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
        <div className="min-h-screen bg-gradient-to-br from-pastel-50 to-pastel-100">
            {/* Hero Section với Video Background */}
            <div className="relative h-screen overflow-hidden">
                {/* Video Background hoặc Fallback */}
                {!videoError ? (
                    <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay
                        loop
                        muted={isVideoMuted}
                        playsInline
                        style={{ filter: 'brightness(0.7) contrast(1.1)' }}
                        onError={handleVideoError}
                    >
                        <source src="https://assets.mixkit.co/videos/preview/mixkit-crowd-at-a-concert-waving-their-hands-in-the-air-4640-large.mp4" type="video/mp4" />
                        <source src="https://assets.mixkit.co/videos/preview/mixkit-people-waving-their-hands-at-a-concert-4641-large.mp4" type="video/mp4" />
                        <source src="https://assets.mixkit.co/videos/preview/mixkit-audience-watching-a-concert-4642-large.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    // Fallback background với animation
                    <div className="absolute inset-0 bg-gradient-to-br from-pastel-500 via-pastel-600 to-pastel-700">
                        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 animate-pulse"></div>
                        <div className="absolute top-0 left-0 w-full h-full">
                            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full animate-bounce"></div>
                            <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-white/10 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                            <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-white/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                            <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/10 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }}></div>
                        </div>
                    </div>
                )}

                {/* Overlay với gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60"></div>

                {/* Video Controls - chỉ hiển thị khi có video */}
                {!videoError && (
                    <div className="absolute top-6 right-6 z-20 flex items-center space-x-4">
                        <button
                            onClick={toggleVideoPlay}
                            className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all duration-300"
                        >
                            {isVideoPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
                        </button>
                        <button
                            onClick={toggleVideoMute}
                            className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all duration-300"
                        >
                            {isVideoMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
                        </button>
                    </div>
                )}

                {/* Hero Content */}
                <div className="relative z-10 h-full flex items-center justify-center text-center text-white px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Logo và Brand */}
                        <div className="mb-8">
                            <div className="flex justify-center items-center mb-6">
                                <FaFireAlt className="text-orange-400 text-5xl mr-4 animate-pulse" />
                                <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-white via-pastel-200 to-pastel-300 bg-clip-text text-transparent">
                                    EventHub
                                </h1>
                                <FaStar className="text-yellow-400 text-5xl ml-4 animate-bounce" />
                            </div>
                        </div>

                        {/* Tagline */}
                        <div className="mb-8">
                            <p className="text-2xl md:text-3xl font-light text-pastel-100 mb-4">
                                🎉 Khám phá những sự kiện tuyệt vời nhất 🎉
                            </p>
                            <p className="text-lg md:text-xl text-pastel-200 max-w-3xl mx-auto leading-relaxed">
                                Tìm kiếm, đặt vé và tham gia các sự kiện hấp dẫn từ âm nhạc, thể thao đến hội nghị chuyên nghiệp
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                to="/events"
                                className="group bg-white text-pastel-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-pastel-50 transition-all duration-300 shadow-2xl hover:shadow-pastel-500/25 transform hover:scale-105 flex items-center"
                            >
                                <FaChartLine className="mr-2 group-hover:rotate-12 transition-transform duration-300" />
                                🎯 Khám phá sự kiện
                            </Link>
                            {!user && (
                                <Link
                                    to="/register"
                                    className="group bg-gradient-to-r from-pastel-500 to-pastel-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-pastel-600 hover:to-pastel-700 transition-all duration-300 shadow-2xl hover:shadow-pastel-500/25 transform hover:scale-105 flex items-center"
                                >
                                    <FaStar className="mr-2 group-hover:rotate-12 transition-transform duration-300" />
                                    🚀 Đăng ký ngay
                                </Link>
                            )}
                        </div>

                        {/* Scroll Indicator */}
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
                                <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured Events Section */}
            <div className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold text-pastel-900 mb-4 flex items-center justify-center">
                            <FaChartLine className="text-pastel-500 mr-4" />
                            Sự kiện nổi bật
                        </h2>
                        <p className="text-xl text-pastel-700 max-w-2xl mx-auto">
                            Những sự kiện được yêu thích nhất và đang thu hút sự chú ý của cộng đồng
                        </p>
                    </div>

                    {/* Featured Events Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        {featuredEvents.map((event) => (
                            <div key={event._id} className="flex justify-center">
                                <FeaturedEventCard event={event} />
                            </div>
                        ))}
                    </div>

                    {/* Regular Events Grid */}
                    {events.length > 0 && (
                        <>
                            <div className="text-center mb-12">
                                <h3 className="text-3xl font-bold text-pastel-900 mb-4">
                                    Tất cả sự kiện
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {events.slice(0, 8).map((event) => (
                                    <div key={event._id} className="flex justify-center">
                                        <EventCard event={event} />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {events.length === 0 && !loading && (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-4">😔</div>
                            <p className="text-pastel-700 text-xl mb-4">
                                Chưa có sự kiện nào được tạo
                            </p>
                            <p className="text-pastel-600">
                                Hãy quay lại sau để khám phá những sự kiện thú vị!
                            </p>
                        </div>
                    )}

                    {/* View All Button */}
                    <div className="text-center mt-12">
                        <Link
                            to="/events"
                            className="inline-flex items-center bg-gradient-to-r from-pastel-500 to-pastel-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-pastel-600 hover:to-pastel-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Xem tất cả sự kiện
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Event Gallery Section */}
            <div className="py-20 bg-gradient-to-br from-pastel-50 to-pastel-100">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold text-pastel-900 mb-4">
                            📸 Thư viện sự kiện
                        </h2>
                        <p className="text-xl text-pastel-700 max-w-3xl mx-auto">
                            Khám phá những khoảnh khắc đáng nhớ từ các sự kiện lớn trong và ngoài nước
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {eventImages.map((event) => (
                            <div key={event.id} className="group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
                                <div className="relative h-80 overflow-hidden">
                                    <img 
                                        src={event.image} 
                                        alt={event.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                    
                                    {/* Event Info Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="bg-pastel-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                                {event.category}
                                            </span>
                                            <FaMapPin className="text-pastel-300" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                                        <p className="text-pastel-200 text-sm">{event.location}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Enhanced Categories Section */}
            <div className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold text-pastel-900 mb-4">
                            🎯 Khám phá theo thể loại
                        </h2>
                        <p className="text-xl text-pastel-700 max-w-3xl mx-auto">
                            Tìm kiếm sự kiện phù hợp với sở thích và đam mê của bạn
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {['Âm nhạc', 'Thể thao', 'Sân khấu', 'Hội nghị'].map((category, index) => {
                            const IconComponent = categoryIcons[category];
                            const colors = [
                                'from-pink-500 to-rose-500',
                                'from-pastel-500 to-pastel-600', 
                                'from-purple-500 to-indigo-500',
                                'from-green-500 to-emerald-500'
                            ];
                            return (
                                <div
                                    key={category}
                                    className={`bg-gradient-to-br ${colors[index]} text-white rounded-3xl shadow-2xl p-8 text-center hover:shadow-3xl transition-all duration-500 cursor-pointer transform hover:scale-105 hover:-translate-y-2 group`}
                                >
                                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <IconComponent className="text-5xl mx-auto" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3">
                                        {category}
                                    </h3>
                                    <p className="text-white/90 text-lg">
                                        Khám phá {category.toLowerCase()}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="py-20 bg-gradient-to-r from-pastel-500 via-pastel-600 to-pastel-700 text-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold mb-4">
                            📊 EventHub trong số liệu
                        </h2>
                        <p className="text-xl text-pastel-100 max-w-3xl mx-auto">
                            Nền tảng sự kiện hàng đầu với hàng nghìn sự kiện và người dùng tin tưởng
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { icon: FaTicketAlt, number: "10,000+", label: "Sự kiện" },
                            { icon: FaUsersIcon, number: "500,000+", label: "Người dùng" },
                            { icon: FaGlobe, number: "50+", label: "Thành phố" },
                            { icon: FaHeart, number: "99%", label: "Hài lòng" }
                        ].map((stat, index) => (
                            <div key={index} className="text-center group">
                                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <stat.icon className="text-4xl mx-auto mb-2" />
                                </div>
                                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                                <div className="text-pastel-100">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Enhanced CTA Section */}
            {!user && (
                <div className="py-20 bg-gradient-to-r from-pastel-500 via-pastel-600 to-pastel-700 text-white relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent transform -skew-y-6"></div>
                    </div>
                    
                    <div className="container mx-auto px-4 text-center relative z-10">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-5xl md:text-6xl font-bold mb-8">
                                🚀 Bạn muốn tổ chức sự kiện?
                            </h2>
                            <p className="text-2xl md:text-3xl text-pastel-100 mb-12 leading-relaxed">
                                Tham gia cộng đồng và bắt đầu bán vé cho sự kiện của bạn ngay hôm nay!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <Link
                                    to="/register"
                                    className="bg-white text-pastel-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-pastel-50 transition-all duration-300 shadow-2xl hover:shadow-white/25 transform hover:scale-105"
                                >
                                    🎫 Bắt đầu ngay
                                </Link>
                                <Link
                                    to="/become-owner"
                                    className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-pastel-600 transition-all duration-300 shadow-2xl hover:shadow-white/25 transform hover:scale-105"
                                >
                                    👑 Trở thành đối tác
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-gray-900 text-white">
                {/* Main Footer */}
                <div className="container mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Company Info */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center mb-6">
                                <FaFireAlt className="text-pastel-500 text-3xl mr-3" />
                                <h3 className="text-3xl font-bold">EventHub</h3>
                            </div>
                            <p className="text-gray-300 mb-6 max-w-md">
                                Nền tảng sự kiện hàng đầu Việt Nam - Kết nối mọi người thông qua những trải nghiệm tuyệt vời và đáng nhớ.
                            </p>
                            <div className="flex space-x-4">
                                <a href="#" className="bg-pastel-500 text-white p-3 rounded-full hover:bg-pastel-600 transition-colors">
                                    <FaFacebook size={20} />
                                </a>
                                <a href="#" className="bg-pastel-500 text-white p-3 rounded-full hover:bg-pastel-600 transition-colors">
                                    <FaTwitter size={20} />
                                </a>
                                <a href="#" className="bg-pastel-500 text-white p-3 rounded-full hover:bg-pastel-600 transition-colors">
                                    <FaInstagram size={20} />
                                </a>
                                <a href="#" className="bg-pastel-500 text-white p-3 rounded-full hover:bg-pastel-600 transition-colors">
                                    <FaYoutube size={20} />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-xl font-bold mb-6">Liên kết nhanh</h4>
                            <ul className="space-y-3">
                                <li><Link to="/events" className="text-gray-300 hover:text-pastel-400 transition-colors">Sự kiện</Link></li>
                                <li><Link to="/about" className="text-gray-300 hover:text-pastel-400 transition-colors">Về chúng tôi</Link></li>
                                <li><Link to="/contact" className="text-gray-300 hover:text-pastel-400 transition-colors">Liên hệ</Link></li>
                                <li><Link to="/help" className="text-gray-300 hover:text-pastel-400 transition-colors">Trợ giúp</Link></li>
                                <li><Link to="/privacy" className="text-gray-300 hover:text-pastel-400 transition-colors">Chính sách</Link></li>
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h4 className="text-xl font-bold mb-6">Liên hệ</h4>
                            <div className="space-y-3">
                                <div className="flex items-center text-gray-300">
                                    <FaPhone className="mr-3 text-pastel-400" />
                                    <span>+84 123 456 789</span>
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <FaEnvelope className="mr-3 text-pastel-400" />
                                    <span>info@eventhub.vn</span>
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <FaMapMarkerAlt className="mr-3 text-pastel-400" />
                                    <span>Hà Nội, Việt Nam</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="border-t border-gray-800 py-12">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { icon: FaShieldAlt, title: "An toàn", desc: "Thanh toán bảo mật" },
                                { icon: FaHeadset, title: "Hỗ trợ 24/7", desc: "Tư vấn nhiệt tình" },
                                { icon: FaCreditCard, title: "Thanh toán", desc: "Nhiều phương thức" },
                                { icon: FaAward, title: "Chất lượng", desc: "Đảm bảo uy tín" }
                            ].map((feature, index) => (
                                <div key={index} className="text-center">
                                    <div className="bg-pastel-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                        <feature.icon className="text-pastel-400 text-2xl" />
                                    </div>
                                    <h5 className="font-bold mb-2">{feature.title}</h5>
                                    <p className="text-gray-400 text-sm">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="border-t border-gray-800 py-6">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <p className="text-gray-400 text-sm">
                                © 2024 EventHub. Tất cả quyền được bảo lưu.
                            </p>
                            <div className="flex space-x-6 mt-4 md:mt-0">
                                <a href="#" className="text-gray-400 hover:text-pastel-400 text-sm">Điều khoản</a>
                                <a href="#" className="text-gray-400 hover:text-pastel-400 text-sm">Bảo mật</a>
                                <a href="#" className="text-gray-400 hover:text-pastel-400 text-sm">Cookie</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home; 