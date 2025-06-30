// Updated at: 2025-01-25 23:17:00 - FORCE REBUILD
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { FaCalendarAlt, FaFire, FaRegClock, FaMapMarkerAlt, FaTicketAlt, FaStar, FaUsers, FaTag } from 'react-icons/fa';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import './HomePage.css';
import { eventAPI } from '../services/api';
import { 
  formatDateTime, 
  formatDate, 
  formatTime, 
  formatPrice, 
  getPriceRange, 
  getAvailableTickets, 
  getTicketStatus, 
  getLocationDisplay, 
  getEventStatus,
  getEventDuration 
} from '../utils/eventHelpers';

const HomePage = () => {
    const [featuredEvents, setFeaturedEvents] = useState([]);
    const [trendingEvents, setTrendingEvents] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Lấy tất cả events từ API
                const response = await eventAPI.getEvents();
                console.log('📊 API Response:', response);
                
                // Backend trả về { success: true, events: [...], data: [...] }
                const allEvents = response.events || response.data || [];
                console.log('📊 All events:', allEvents);
                console.log('📊 First event sample:', allEvents[0]);

                // Phân chia events theo sections
                setFeaturedEvents(allEvents.slice(0, 3));
                setTrendingEvents(allEvents.slice(0, 6));
                setUpcomingEvents(allEvents.slice(0, 8));

                // Lấy danh mục
                const categoriesData = [
                    { id: 1, name: 'Âm nhạc', icon: '🎵' },
                    { id: 2, name: 'Thể thao', icon: '⚽' },
                    { id: 3, name: 'Workshop', icon: '🎨' },
                    { id: 4, name: 'Triển lãm', icon: '🖼️' },
                    { id: 5, name: 'Hội thảo', icon: '🎤' },
                    { id: 6, name: 'Giải trí', icon: '🎪' }
                ];
                setCategories(categoriesData);

                setLoading(false);
            } catch (err) {
                setError('Có lỗi xảy ra khi tải dữ liệu');
                setLoading(false);
                console.error('Error fetching data:', err);
            }
        };

        fetchData();
    }, []);

    // Helper functions đã được move sang eventHelpers.js

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const EventCard = ({ event, showFullDetails = false }) => {
        // Simple helper functions
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
                return 'Liên hệ để biết giá';
            }
            
            if (typeof ticketTypes[0] === 'string') {
                return 'Liên hệ để biết giá';
            }
            
            const prices = ticketTypes.map(t => t.price).filter(p => p && !isNaN(p) && p > 0);
            
            if (prices.length === 0) {
                return 'Miễn phí';
            }
            
            const min = Math.min(...prices);
            return `${min.toLocaleString('vi-VN')} VNĐ`;
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
            
            // Cải thiện logic xử lý URL ảnh
            const imagePath = event.images[0];
            if (imagePath.startsWith('http')) {
                return imagePath;
            }
            
            // Nếu là relative path, thêm base URL
            const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
            return `${baseURL}${imagePath}`;
        };

        const handleBooking = () => {
            if (event.eventType === 'seating') {
                navigate(`/select-seat/${event._id}`);
            } else {
                navigate(`/simple-booking/${event._id}`);
            }
        };

        const startDateFormatted = safeFormatDate(event.startDate);
        const priceDisplay = safeGetPrice(event.ticketTypes);

        return (
            <div className="event-card bg-white rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                {/* Hình ảnh sự kiện */}
                <div className="card-image">
                    <img 
                        src={getEventImage()} 
                        alt={event.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.src = '/images/placeholder-event.svg';
                            e.target.onerror = null; // Prevent infinite loop
                        }}
                    />
                </div>

                {/* Nội dung */}
                <div className="card-content">
                    {/* Tên sự kiện */}
                    <h3 className="card-title">
                        {event.title}
                    </h3>

                    {/* Giá */}
                    <div className="card-price">
                        {priceDisplay}
                    </div>

                    {/* Ngày tháng */}
                    <div className="card-date">
                        {startDateFormatted}
                    </div>

                    {/* Nút đặt vé - luôn ở cuối */}
                    <button
                        onClick={handleBooking}
                        className="card-button"
                    >
                        Đặt vé ngay
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative h-[700px]">
                <Swiper
                    modules={[Navigation, Pagination, Autoplay, EffectFade]}
                    effect="fade"
                    navigation
                    pagination={{ clickable: true }}
                    autoplay={{ delay: 5000 }}
                    loop={true}
                    className="h-full"
                >
                    {featuredEvents.map(event => {
                        // Simple helpers for hero section
                        const heroDateFormatted = event.startDate 
                            ? new Date(event.startDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                            : 'Ngày sẽ được cập nhật';
                        const heroTimeFormatted = event.startDate
                            ? new Date(event.startDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                            : 'TBA';
                        const heroPriceRange = 'Liên hệ để biết giá';
                        const heroLocationDisplay = 'Địa điểm sẽ được cập nhật';
                        
                        const getHeroEventImage = () => {
                            // Handle old format: event.images = {logo: "url", banner: "url"}
                            if (event.images && typeof event.images === 'object' && !Array.isArray(event.images)) {
                                return event.images.banner || event.images.logo || 'https://via.placeholder.com/1200x700?text=Featured+Event';
                            }
                            
                            // Handle new format: event.images = ["/uploads/events/filename.jpg"]
                            if (!event.images || !Array.isArray(event.images) || event.images.length === 0) {
                                return 'https://via.placeholder.com/1200x700?text=Featured+Event';
                            }
                            
                            // Cải thiện logic xử lý URL ảnh cho hero
                            const imagePath = event.images[0];
                            if (imagePath.startsWith('http')) {
                                return imagePath;
                            }
                            
                            const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
                            return `${baseURL}${imagePath}`;
                        };
                        
                        return (
                            <SwiperSlide key={event._id}>
                                <div className="relative h-full">
                                    <img 
                                        src={getHeroEventImage()} 
                                        alt={event.title} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/1200x700?text=Featured+Event';
                                            e.target.onerror = null;
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 flex items-center">
                                        <div className="container mx-auto px-4">
                                            <div className="max-w-2xl text-white">
                                                <h1 className="text-6xl font-bold mb-4 leading-tight">
                                                    {event.title || 'Sự kiện đặc biệt'}
                                                </h1>
                                                <div className="flex items-center mb-4 text-xl">
                                                    <FaCalendarAlt className="mr-3" />
                                                    <span>{heroDateFormatted} • {heroTimeFormatted}</span>
                                                </div>
                                                <div className="flex items-center mb-6 text-xl">
                                                    <FaMapMarkerAlt className="mr-3" />
                                                    <span>{heroLocationDisplay}</span>
                                                </div>
                                                <div className="mb-8">
                                                    <span className="text-3xl font-bold text-yellow-400">{heroPriceRange}</span>
                                                </div>
                                                <div className="flex gap-4">
                                                    <Link 
                                                        to={event.eventType === 'seating' ? `/select-seat/${event._id}` : `/simple-booking/${event._id}`}
                                                        className="bg-green-500 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-green-600 transition-colors"
                                                    >
                                                        Đặt vé ngay
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </section>

            {/* Categories Section */}
            <section className="container mx-auto py-16 px-4">
                <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Khám phá theo danh mục</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {categories.map(category => (
                        <Link 
                            key={category.id}
                            to={`/categories/${category.id}`}
                            className="bg-white rounded-xl p-6 text-center shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                        >
                            <span className="text-4xl mb-4 block">{category.icon}</span>
                            <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Trending Events Section */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-700 py-20">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-white text-center mb-12">Sự kiện nổi bật</h2>
                    {trendingEvents.length > 0 ? (
                        <div className="events-grid events-grid-3">
                            {trendingEvents.map(event => (
                                <EventCard key={event._id} event={event} showFullDetails={true} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-white">
                            <div className="text-6xl mb-4">🎪</div>
                            <h3 className="text-2xl mb-2">Chưa có sự kiện nổi bật</h3>
                            <p className="text-blue-100">Các sự kiện hấp dẫn sẽ sớm được cập nhật</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Upcoming Events Section */}
            <section className="container mx-auto py-20 px-4">
                <h2 className="section-title">Sự kiện sắp diễn ra</h2>
                {upcomingEvents.length > 0 ? (
                    <>
                        <div className="events-grid events-grid-4">
                            {upcomingEvents.map(event => (
                                <EventCard key={event._id} event={event} />
                            ))}
                        </div>
                        <div className="text-center mt-12">
                            <Link 
                                to="/events"
                                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                            >
                                Xem tất cả sự kiện
                                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="text-6xl mb-4">📅</div>
                        <h3 className="text-2xl mb-2 text-gray-700">Chưa có sự kiện sắp diễn ra</h3>
                        <p className="text-gray-500 mb-6">Các sự kiện thú vị đang được chuẩn bị</p>
                        <Link 
                            to="/become-owner"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Tạo sự kiện của bạn
                        </Link>
                    </div>
                )}
            </section>

            {/* Quick Stats Section */}
            <section className="bg-gradient-to-r from-green-500 to-teal-600 py-16">
                <div className="container mx-auto px-4">
                    <div className="stats-grid text-white">
                        <div>
                            <div className="stats-number">1000+</div>
                            <div className="stats-label">Sự kiện đã tổ chức</div>
                        </div>
                        <div>
                            <div className="stats-number">50K+</div>
                            <div className="stats-label">Khách hàng hài lòng</div>
                        </div>
                        <div>
                            <div className="stats-number">200+</div>
                            <div className="stats-label">Đối tác tin cậy</div>
                        </div>
                        <div>
                            <div className="stats-number">24/7</div>
                            <div className="stats-label">Hỗ trợ khách hàng</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Newsletter Section */}
            <section className="bg-gray-900 text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-4">Đừng bỏ lỡ bất kỳ sự kiện nào!</h2>
                    <p className="text-xl text-gray-400 mb-8">Đăng ký nhận thông báo về các sự kiện mới nhất và ưu đãi đặc biệt</p>
                    <div className="newsletter-form">
                        <input 
                            type="email" 
                            placeholder="Nhập email của bạn" 
                            className="newsletter-input"
                        />
                        <button className="newsletter-button">
                            Đăng ký ngay
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                        Bằng việc đăng ký, bạn đồng ý với <span className="text-blue-400">Điều khoản sử dụng</span> và <span className="text-blue-400">Chính sách bảo mật</span>
                    </p>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="container mx-auto py-20 px-4">
                <h2 className="section-title">Tại sao chọn chúng tôi?</h2>
                <p className="section-subtitle">
                    Chúng tôi cam kết mang đến trải nghiệm đặt vé tốt nhất với dịch vụ chuyên nghiệp và đáng tin cậy
                </p>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon bg-blue-100">
                            <FaTicketAlt className="text-blue-600" />
                        </div>
                        <h3 className="feature-title">Đặt vé dễ dàng</h3>
                        <p className="feature-description">
                            Quy trình đặt vé đơn giản, nhanh chóng chỉ với vài bước. 
                            Thanh toán an toàn với nhiều phương thức khác nhau.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon bg-green-100">
                            <FaCalendarAlt className="text-green-600" />
                        </div>
                        <h3 className="feature-title">Sự kiện đa dạng</h3>
                        <p className="feature-description">
                            Hàng nghìn sự kiện hấp dẫn từ âm nhạc, thể thao đến hội thảo, 
                            workshop được cập nhật thường xuyên.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon bg-purple-100">
                            <FaFire className="text-purple-600" />
                        </div>
                        <h3 className="feature-title">Ưu đãi hấp dẫn</h3>
                        <p className="feature-description">
                            Thường xuyên có các chương trình khuyến mãi đặc biệt, 
                            early bird discount và ưu đãi cho khách hàng thân thiết.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon bg-yellow-100">
                            <FaUsers className="text-yellow-600" />
                        </div>
                        <h3 className="feature-title">Cộng đồng lớn</h3>
                        <p className="feature-description">
                            Tham gia cộng đồng hàng nghìn người yêu thích sự kiện, 
                            chia sẻ kinh nghiệm và kết nối với những người có cùng sở thích.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon bg-red-100">
                            <FaMapMarkerAlt className="text-red-600" />
                        </div>
                        <h3 className="feature-title">Địa điểm thuận tiện</h3>
                        <p className="feature-description">
                            Các sự kiện được tổ chức tại những địa điểm thuận tiện, 
                            dễ dàng di chuyển với đầy đủ tiện ích và dịch vụ.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon bg-indigo-100">
                            <FaStar className="text-indigo-600" />
                        </div>
                        <h3 className="feature-title">Chất lượng đảm bảo</h3>
                        <p className="feature-description">
                            Tất cả sự kiện đều được kiểm duyệt kỹ lưỡng về chất lượng, 
                            đảm bảo mang đến trải nghiệm tuyệt vời cho khách tham dự.
                        </p>
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-700 py-20">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Sẵn sàng khám phá sự kiện tiếp theo?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Tham gia hàng nghìn sự kiện thú vị, kết nối với cộng đồng và tạo nên những kỷ niệm đáng nhớ
                    </p>
                    <div className="cta-buttons">
                        <Link 
                            to="/events"
                            className="cta-primary"
                        >
                            Khám phá sự kiện
                        </Link>
                        <Link 
                            to="/become-owner"
                            className="cta-secondary"
                        >
                            Tổ chức sự kiện
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage; 