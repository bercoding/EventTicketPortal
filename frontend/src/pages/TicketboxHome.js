import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaCalendar, FaClock, FaMapMarkerAlt, FaTicketAlt, FaStar, FaFire, FaMusic, FaHeart, FaUsers, FaTrophy } from 'react-icons/fa';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './TicketboxHome.css';

const TicketboxHome = () => {
    const [isVideoMuted, setIsVideoMuted] = useState(true);
    const [videoError, setVideoError] = useState(false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(true);
    const [ongoingEvents, setOngoingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const videoRef = useRef(null);

    // Helper function to get venue display text
    const getVenueDisplay = (venue) => {
        if (typeof venue === 'string') {
            return venue;
        } else if (venue && typeof venue === 'object') {
            // Handle venue object with venueName, address, etc.
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

    // Helper function to get event title
    const getEventTitle = (event) => {
        return event.title || event.eventName || 'Sự kiện không có tên';
    };

    // Helper function to get event image
    const getEventImage = (event) => {
        // Handle different image formats from database
        if (event.images && Array.isArray(event.images) && event.images.length > 0) {
            // New format: event.images = ["/uploads/events/filename.jpg"]
            return `http://localhost:5001${event.images[0]}`;
        } else if (event.images && typeof event.images === 'object' && !Array.isArray(event.images)) {
            // Old format: event.images = {logo: "url", banner: "url"}
            return event.images.banner || event.images.logo;
        } else if (event.image) {
            // Direct image field
            return event.image;
        } else if (event.eventImage) {
            // Alternative image field
            return event.eventImage;
        }
        
        // Fallback to default image only if no image is found
        return "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80";
    };

    // Helper function to get event category
    const getEventCategory = (event) => {
        return event.category || event.eventCategory || "Sự kiện";
    };

    // Helper function to get event price
    const getEventPrice = (event) => {
        return event.price || event.ticketPrice || 'Liên hệ';
    };

    // Helper function to get event time
    const getEventTime = (event) => {
        return event.time || event.eventTime || 'Chưa có giờ';
    };

    const handleVideoError = () => {
        setVideoError(true);
    };

    const toggleVideoPlayback = () => {
        if (videoRef.current) {
            if (isVideoPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsVideoPlaying(!isVideoPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isVideoMuted;
            setIsVideoMuted(!isVideoMuted);
        }
    };

    // Fetch ongoing events from database
    useEffect(() => {
        const fetchOngoingEvents = async () => {
            try {
                setLoading(true);
                console.log('🔄 Fetching events from database...');
                
                // Fetch all events from your database
                const response = await fetch('http://localhost:5001/api/events');
                const data = await response.json();
                
                console.log('📊 API Response:', data);
                
                if (data.success && data.events) {
                    console.log('✅ Found events:', data.events.length);
                    // Show all events instead of filtering by date
                    const eventsToShow = data.events.slice(0, 8); // Limit to 8 events
                    setOngoingEvents(eventsToShow);
                } else if (data.success && data.data) {
                    console.log('✅ Found events in data field:', data.data.length);
                    // Alternative response format
                    const eventsToShow = data.data.slice(0, 8);
                    setOngoingEvents(eventsToShow);
                } else {
                    console.log('⚠️ No events found, using fallback data');
                    // Fallback to sample data if API fails
                    setOngoingEvents(sampleOngoingEvents);
                }
            } catch (error) {
                console.error('❌ Error fetching ongoing events:', error);
                // Fallback to sample data
                setOngoingEvents(sampleOngoingEvents);
            } finally {
                setLoading(false);
            }
        };

        fetchOngoingEvents();
    }, []);

    // Sample ongoing events data (fallback)
    const sampleOngoingEvents = [
        {
            _id: 1,
            title: "Taylor Swift - The Eras Tour",
            category: "Music",
            date: "2024-12-15",
            time: "20:00",
            venue: "Sân vận động Quốc gia Mỹ Đình",
            price: "2,500,000 VNĐ",
            image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            featured: true
        },
        {
            _id: 2,
            title: "Ed Sheeran Live in Vietnam",
            category: "Music",
            date: "2024-11-20",
            time: "19:30",
            venue: "Hoa Binh Theater",
            price: "1,800,000 VNĐ",
            image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            featured: false
        },
        {
            _id: 3,
            title: "BTS World Tour 2024",
            category: "Music",
            date: "2024-10-25",
            time: "20:00",
            venue: "Landmark 81",
            price: "3,200,000 VNĐ",
            image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            featured: true
        },
        {
            _id: 4,
            title: "Coldplay - Music of the Spheres",
            category: "Music",
            date: "2024-09-30",
            time: "19:00",
            venue: "Saigon Exhibition Center",
            price: "2,800,000 VNĐ",
            image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            featured: false
        },
        {
            _id: 5,
            title: "Blackpink - Born Pink World Tour",
            category: "Music",
            date: "2024-08-15",
            time: "20:30",
            venue: "My Dinh National Stadium",
            price: "2,900,000 VNĐ",
            image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            featured: true
        },
        {
            _id: 6,
            title: "The Weeknd - After Hours Til Dawn",
            category: "Music",
            date: "2024-07-20",
            time: "21:00",
            venue: "Hoa Binh Theater",
            price: "2,100,000 VNĐ",
            image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            featured: false
        }
    ];

    // Sample events data for "All Events" section
    const events = [
        {
            id: 1,
            title: "Taylor Swift - The Eras Tour",
            category: "Music",
            date: "2024-12-15",
            time: "20:00",
            venue: "Sân vận động Quốc gia Mỹ Đình",
            price: "2,500,000 VNĐ",
            image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            featured: true
        },
        {
            id: 2,
            title: "Ed Sheeran Live in Vietnam",
            category: "Music",
            date: "2024-11-20",
            time: "19:30",
            venue: "Hoa Binh Theater",
            price: "1,800,000 VNĐ",
            image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            featured: false
        },
        {
            id: 3,
            title: "BTS World Tour 2024",
            category: "Music",
            date: "2024-10-25",
            time: "20:00",
            venue: "Landmark 81",
            price: "3,200,000 VNĐ",
            image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            featured: true
        },
        {
            id: 4,
            title: "Coldplay - Music of the Spheres",
            category: "Music",
            date: "2024-09-30",
            time: "19:00",
            venue: "Saigon Exhibition Center",
            price: "2,800,000 VNĐ",
            image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            featured: false
        },
        {
            id: 5,
            title: "Blackpink - Born Pink World Tour",
            category: "Music",
            date: "2024-08-15",
            time: "20:30",
            venue: "My Dinh National Stadium",
            price: "2,900,000 VNĐ",
            image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            featured: true
        },
        {
            id: 6,
            title: "The Weeknd - After Hours Til Dawn",
            category: "Music",
            date: "2024-07-20",
            time: "21:00",
            venue: "Hoa Binh Theater",
            price: "2,100,000 VNĐ",
            image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            featured: false
        }
    ];

    // Famous concert images for carousel
    const famousConcerts = [
        {
            id: 1,
            title: "Taylor Swift - The Eras Tour",
            image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            description: "World's biggest music tour"
        },
        {
            id: 2,
            title: "BTS - Permission to Dance",
            image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            description: "Global K-pop sensation"
        },
        {
            id: 3,
            title: "Ed Sheeran - Mathematics Tour",
            image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            description: "Acoustic magic live"
        }
    ];

    const categories = [
        { name: "Âm nhạc", icon: <FaMusic />, count: "150+" },
        { name: "Thể thao", icon: <FaTrophy />, count: "80+" },
        { name: "Hội nghị", icon: <FaUsers />, count: "120+" },
        { name: "Giải trí", icon: <FaHeart />, count: "200+" }
    ];

    return (
        <div className="min-h-screen bg-black">
            {/* Hero Section với Video Background */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Video Background - Real concert video */}
                {!videoError ? (
                    <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay
                        loop
                        muted={isVideoMuted}
                        playsInline
                        style={{ filter: 'brightness(0.3) contrast(1.2)' }}
                        onError={handleVideoError}
                    >
                        {/* Real concert videos from various sources */}
                        <source src="https://player.vimeo.com/external/434045526.hd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=175&oauth2_token_id=57447761" type="video/mp4" />
                        <source src="https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164&oauth2_token_id=57447761" type="video/mp4" />
                        
                        {/* Alternative concert videos */}
                        <source src="https://cdn.pixabay.com/vimeo/3287147/concert-23857.mp4?width=1280&hash=8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c" type="video/mp4" />
                        <source src="https://cdn.pixabay.com/vimeo/3287148/concert-23858.mp4?width=1280&hash=9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d" type="video/mp4" />
                        <source src="https://cdn.pixabay.com/vimeo/3287149/concert-23859.mp4?width=1280&hash=0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e" type="video/mp4" />
                        
                        {/* High-quality concert videos */}
                        <source src="https://assets.mixkit.co/videos/preview/mixkit-crowd-at-a-concert-waving-their-hands-in-the-air-4640-large.mp4" type="video/mp4" />
                        <source src="https://assets.mixkit.co/videos/preview/mixkit-people-dancing-at-a-concert-4644-large.mp4" type="video/mp4" />
                        <source src="https://assets.mixkit.co/videos/preview/mixkit-concert-lights-and-crowd-4646-large.mp4" type="video/mp4" />
                        <source src="https://assets.mixkit.co/videos/preview/mixkit-concert-stage-with-lights-4649-large.mp4" type="video/mp4" />
                        
                        {/* Additional concert videos */}
                        <source src="https://assets.mixkit.co/videos/preview/mixkit-crowd-singing-along-at-a-concert-4645-large.mp4" type="video/mp4" />
                        <source src="https://assets.mixkit.co/videos/preview/mixkit-people-jumping-at-a-concert-4647-large.mp4" type="video/mp4" />
                        <source src="https://assets.mixkit.co/videos/preview/mixkit-concert-laser-show-4655-large.mp4" type="video/mp4" />
                        <source src="https://assets.mixkit.co/videos/preview/mixkit-concert-fireworks-4657-large.mp4" type="video/mp4" />
                        
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    // Fallback background với animation đen lấp lánh
                    <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 animate-pulse"></div>
                        <div className="absolute top-0 left-0 w-full h-full">
                            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-400/20 rounded-full animate-bounce"></div>
                            <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-blue-400/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                            <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-blue-400/20 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                            <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-blue-400/20 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }}></div>
                        </div>
                    </div>
                )}

                {/* Overlay với gradient đen lấp lánh */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>

                {/* Video Controls */}
                <div className="absolute top-4 right-4 z-10 flex space-x-2">
                    <button
                        onClick={toggleVideoPlayback}
                        className="p-2 bg-black/50 hover:bg-black/70 text-blue-300 rounded-full transition-all duration-300 backdrop-blur-sm"
                    >
                        {isVideoPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
                    </button>
                    <button
                        onClick={toggleMute}
                        className="p-2 bg-black/50 hover:bg-black/70 text-blue-300 rounded-full transition-all duration-300 backdrop-blur-sm"
                    >
                        {isVideoMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
                    </button>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <div className="flex items-center justify-center mb-6">
                        <FaFire className="text-orange-500 text-4xl mr-3" />
                        <h1 className="text-6xl md:text-8xl font-bold text-white mb-0">
                            EventHub
                        </h1>
                        <FaStar className="text-yellow-400 text-4xl ml-3" />
                    </div>
                    
                    <p className="text-xl md:text-2xl text-blue-200 mb-6 flex items-center justify-center">
                        🎉 Khám phá những sự kiện tuyệt vời nhất 🎉
                    </p>
                    
                    <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                        Tìm kiếm, đặt vé và tham gia các sự kiện hấp dẫn từ âm nhạc, thể thao đến hội nghị chuyên nghiệp
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/events"
                            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-full hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            <FaCalendar className="mr-2" />
                            Khám phá sự kiện
                        </Link>
                        <Link
                            to="/register"
                            className="inline-flex items-center px-8 py-4 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            <FaStar className="mr-2" />
                            Đăng ký ngay
                        </Link>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 border-2 border-blue-300 rounded-full flex justify-center">
                        <div className="w-1 h-3 bg-blue-300 rounded-full mt-2 animate-pulse"></div>
                    </div>
                </div>
            </section>

            {/* Famous Concerts Carousel Section */}
            <section className="py-16 px-4 bg-gradient-to-b from-black to-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center mb-4">
                            <FaFire className="text-blue-400 text-3xl mr-3" />
                            <h2 className="text-4xl md:text-5xl font-bold text-blue-200">
                                Concert Nổi Tiếng
                            </h2>
                        </div>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                            Những concert đình đám nhất thế giới đã và sẽ diễn ra tại Việt Nam
                        </p>
                    </div>

                    <Swiper
                        modules={[Navigation, Pagination, Autoplay]}
                        spaceBetween={30}
                        slidesPerView={1}
                        navigation={true}
                        pagination={{ clickable: true }}
                        autoplay={{ delay: 5000, disableOnInteraction: false }}
                        breakpoints={{
                            768: {
                                slidesPerView: 2,
                                spaceBetween: 30,
                            },
                            1024: {
                                slidesPerView: 3,
                                spaceBetween: 30,
                            },
                        }}
                        className="famous-concerts-swiper"
                    >
                        {famousConcerts.map((concert) => (
                            <SwiperSlide key={concert.id}>
                                <div className="relative group overflow-hidden rounded-2xl shadow-2xl">
                                    <div className="aspect-[4/3] overflow-hidden">
                                        <img
                                            src={concert.image}
                                            alt={concert.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-6">
                                        <h3 className="text-xl font-bold text-white mb-2">{concert.title}</h3>
                                        <p className="text-blue-200">{concert.description}</p>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-16 px-4 bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold text-blue-200 mb-4">
                            Khám phá theo danh mục
                        </h2>
                        <p className="text-xl text-gray-300">
                            Tìm kiếm sự kiện phù hợp với sở thích của bạn
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {categories.map((category, index) => (
                            <div
                                key={index}
                                className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl text-center hover:from-blue-900/20 hover:to-blue-800/20 transition-all duration-300 border border-gray-700 hover:border-blue-400/50 group cursor-pointer"
                            >
                                <div className="text-4xl text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                                    {category.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-blue-200 mb-2">{category.name}</h3>
                                <p className="text-gray-400">{category.count} sự kiện</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Ongoing Events Section */}
            <section className="py-16 px-4 bg-black">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold text-blue-200 mb-4">
                            Sự kiện đang diễn ra
                        </h2>
                        <p className="text-xl text-gray-300">
                            Những sự kiện hot nhất đang thu hút sự chú ý của cộng đồng
                        </p>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-xl animate-pulse">
                                    <div className="w-full h-48 bg-gray-700"></div>
                                    <div className="p-6 space-y-4">
                                        <div className="h-6 bg-gray-700 rounded"></div>
                                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                                        <div className="h-10 bg-gray-700 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {console.log('🎯 Rendering events:', ongoingEvents.length, ongoingEvents)}
                            {ongoingEvents.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">😔</div>
                                    <p className="text-gray-300 text-xl mb-4">
                                        Chưa có sự kiện nào được tạo
                                    </p>
                                    <p className="text-gray-400">
                                        Hãy tạo sự kiện đầu tiên để bắt đầu!
                                    </p>
                                </div>
                            ) : (
                                <Swiper
                                    modules={[Navigation, Pagination, Autoplay]}
                                    spaceBetween={30}
                                    slidesPerView={1}
                                    navigation={true}
                                    pagination={{ clickable: true }}
                                    autoplay={{ delay: 4000, disableOnInteraction: false }}
                                    breakpoints={{
                                        640: {
                                            slidesPerView: 2,
                                            spaceBetween: 20,
                                        },
                                        768: {
                                            slidesPerView: 3,
                                            spaceBetween: 30,
                                        },
                                        1024: {
                                            slidesPerView: 4,
                                            spaceBetween: 30,
                                        },
                                    }}
                                    className="ongoing-events-swiper"
                                >
                                    {ongoingEvents.map((event) => (
                                        <SwiperSlide key={event._id || event.id}>
                                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-blue-400/50 group">
                                                <div className="relative">
                                                    <img
                                                        src={getEventImage(event)}
                                                        alt={getEventTitle(event)}
                                                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                            e.target.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80";
                                                        }}
                                                    />
                                                    {event.featured && (
                                                        <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                                                            <FaStar className="mr-1" />
                                                            Nổi bật
                                                        </div>
                                                    )}
                                                    <div className="absolute top-3 right-3 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                        {getEventCategory(event)}
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <h3 className="text-xl font-bold text-blue-200 mb-3 line-clamp-2">
                                                        {getEventTitle(event)}
                                                    </h3>
                                                    <div className="space-y-2 mb-4">
                                                        <div className="flex items-center text-gray-300">
                                                            <FaCalendar className="mr-2 text-blue-400" />
                                                            <span>{event.date ? new Date(event.date).toLocaleDateString('vi-VN') : 'Chưa có ngày'}</span>
                                                        </div>
                                                        <div className="flex items-center text-gray-300">
                                                            <FaClock className="mr-2 text-blue-400" />
                                                            <span>{getEventTime(event)}</span>
                                                        </div>
                                                        <div className="flex items-center text-gray-300">
                                                            <FaMapMarkerAlt className="mr-2 text-blue-400" />
                                                            <span className="line-clamp-1">
                                                                {getVenueDisplay(event.venue || event.eventVenue)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center text-blue-300 font-semibold">
                                                            <FaTicketAlt className="mr-2" />
                                                            <span>{getEventPrice(event)}</span>
                                                        </div>
                                                    </div>
                                                    <Link
                                                        to={`/events/${event._id || event.id}`}
                                                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center"
                                                    >
                                                        Chi tiết
                                                    </Link>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* All Events Section */}
            <section className="py-16 px-4 bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold text-blue-200 mb-4">
                            Tất cả sự kiện
                        </h2>
                        <p className="text-xl text-gray-300">
                            Khám phá những sự kiện mới nhất và hấp dẫn nhất
                        </p>
                    </div>

                    <Swiper
                        modules={[Navigation, Pagination, Autoplay]}
                        spaceBetween={30}
                        slidesPerView={1}
                        navigation={true}
                        pagination={{ clickable: true }}
                        autoplay={{ delay: 4000, disableOnInteraction: false }}
                        breakpoints={{
                            640: {
                                slidesPerView: 2,
                                spaceBetween: 20,
                            },
                            768: {
                                slidesPerView: 3,
                                spaceBetween: 30,
                            },
                            1024: {
                                slidesPerView: 4,
                                spaceBetween: 30,
                            },
                        }}
                        className="events-swiper"
                    >
                        {events.map((event) => (
                            <SwiperSlide key={event.id}>
                                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-blue-400/50 group">
                                    <div className="relative">
                                        <img
                                            src={getEventImage(event)}
                                            alt={getEventTitle(event)}
                                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80";
                                            }}
                                        />
                                        {event.featured && (
                                            <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                                                <FaStar className="mr-1" />
                                                Nổi bật
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                            {getEventCategory(event)}
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-blue-200 mb-3 line-clamp-2">
                                            {getEventTitle(event)}
                                        </h3>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center text-gray-300">
                                                <FaCalendar className="mr-2 text-blue-400" />
                                                <span>{event.date}</span>
                                            </div>
                                            <div className="flex items-center text-gray-300">
                                                <FaClock className="mr-2 text-blue-400" />
                                                <span>{event.time}</span>
                                            </div>
                                            <div className="flex items-center text-gray-300">
                                                <FaMapMarkerAlt className="mr-2 text-blue-400" />
                                                <span className="line-clamp-1">{event.venue}</span>
                                            </div>
                                            <div className="flex items-center text-blue-300 font-semibold">
                                                <FaTicketAlt className="mr-2" />
                                                <span>{getEventPrice(event)}</span>
                                            </div>
                                        </div>
                                        <Link
                                            to={`/events/${event.id}`}
                                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center"
                                        >
                                            Chi tiết
                                        </Link>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-black">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">50K+</div>
                            <div className="text-gray-300">Người dùng</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">500+</div>
                            <div className="text-gray-300">Sự kiện</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">100+</div>
                            <div className="text-gray-300">Đối tác</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">98%</div>
                            <div className="text-gray-300">Hài lòng</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer - 12-column grid layout */}
            <footer className="bg-black py-8 px-4 border-t border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-12 gap-6">
                        {/* EventHub Branding - 4 columns */}
                        <div className="col-span-12 md:col-span-4">
                            <div className="flex items-center mb-4">
                                <FaFire className="text-blue-400 text-2xl mr-2" />
                                <h3 className="text-xl font-bold text-blue-200">EventHub</h3>
                            </div>
                            <p className="text-gray-400 text-sm">
                                Nền tảng đặt vé sự kiện hàng đầu Việt Nam
                            </p>
                        </div>

                        {/* Services - 4 columns */}
                        <div className="col-span-6 md:col-span-2">
                            <h4 className="text-blue-200 font-semibold mb-4">Dịch vụ</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-blue-300 transition-colors">Đặt vé</a></li>
                                <li><a href="#" className="hover:text-blue-300 transition-colors">Tạo sự kiện</a></li>
                                <li><a href="#" className="hover:text-blue-300 transition-colors">Quản lý sự kiện</a></li>
                                <li><a href="#" className="hover:text-blue-300 transition-colors">Hỗ trợ</a></li>
                            </ul>
                        </div>

                        {/* Company - 4 columns */}
                        <div className="col-span-6 md:col-span-2">
                            <h4 className="text-blue-200 font-semibold mb-4">Công ty</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-blue-300 transition-colors">Về chúng tôi</a></li>
                                <li><a href="#" className="hover:text-blue-300 transition-colors">Tuyển dụng</a></li>
                                <li><a href="#" className="hover:text-blue-300 transition-colors">Liên hệ</a></li>
                                <li><a href="#" className="hover:text-blue-300 transition-colors">Tin tức</a></li>
                            </ul>
                        </div>

                        {/* Contact - 4 columns */}
                        <div className="col-span-12 md:col-span-4">
                            <h4 className="text-blue-200 font-semibold mb-4">Liên hệ</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>Email: info@eventhub.vn</li>
                                <li>Phone: 1900-1234</li>
                                <li>Địa chỉ: TP.HCM, Việt Nam</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center">
                        <p className="text-gray-400 text-sm">
                            © 2024 EventHub. Tất cả quyền được bảo lưu.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default TicketboxHome; 