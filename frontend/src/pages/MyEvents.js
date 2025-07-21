import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
    FiEdit2, FiTrash2, FiEye, FiPlus, FiCalendar, FiMapPin, FiUsers, FiDollarSign,
    FiFilter, FiGrid, FiList, FiSearch, FiRefreshCw, FiTrendingUp, FiClock, FiCheckCircle
} from 'react-icons/fi';
import { 
    FaFireAlt, FaStar, FaChartLine, FaTicketAlt, FaUsers as FaUsersIcon,
    FaCalendarAlt, FaMapMarkerAlt, FaDollarSign, FaEye, FaEdit, FaTrash,
    FaMoon, FaSun, FaMagic
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { getEventPlaceholder, handleImageError } from '../utils/imageHelpers';

const MyEvents = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, upcoming, past, draft
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/events/my-events');
            setEvents(response.data);
        } catch (error) {
            console.error('Error fetching my events:', error);
            setError('Không thể tải danh sách sự kiện của bạn');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) return;
        
        try {
            await api.delete(`/events/${eventId}`);
            setEvents(events.filter(event => event._id !== eventId));
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Không thể xóa sự kiện');
        }
    };

    const getFilteredEvents = () => {
        const now = new Date();
        let filtered = events;
        
        // Filter by status
        switch (filter) {
            case 'upcoming':
                filtered = events.filter(event => new Date(event.startDate) > now);
                break;
            case 'past':
                filtered = events.filter(event => new Date(event.endDate) < now);
                break;
            case 'draft':
                filtered = events.filter(event => event.status === 'draft');
                break;
            default:
                filtered = events;
        }
        
        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(event => 
                event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (event.location?.venueName && event.location.venueName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        return filtered;
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'active': { 
                color: 'bg-gradient-to-r from-emerald-400 to-teal-500', 
                text: 'Đang hoạt động',
                icon: FiCheckCircle
            },
            'draft': { 
                color: 'bg-gradient-to-r from-slate-500 to-gray-600', 
                text: 'Bản nháp',
                icon: FiClock
            },
            'cancelled': { 
                color: 'bg-gradient-to-r from-rose-400 to-pink-500', 
                text: 'Đã hủy',
                icon: FiTrash2
            },
            'completed': { 
                color: 'bg-gradient-to-r from-blue-400 to-indigo-500', 
                text: 'Đã hoàn thành',
                icon: FiCheckCircle
            }
        };
        const config = statusConfig[status] || statusConfig['draft'];
        const IconComponent = config.icon;
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white ${config.color} shadow-lg backdrop-blur-sm`}>
                <IconComponent className="mr-1 h-3 w-3" />
                {config.text}
            </span>
        );
    };

    const getEventStats = () => {
        const now = new Date();
        const upcoming = events.filter(e => new Date(e.startDate) > now).length;
        const past = events.filter(e => new Date(e.endDate) < now).length;
        const draft = events.filter(e => e.status === 'draft').length;
        const total = events.length;
        
        return { upcoming, past, draft, total };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-pastel-400 mx-auto mb-6"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-pastel-400/20 animate-ping"></div>
                    </div>
                    <p className="text-pastel-300 text-lg font-medium">Đang tải sự kiện...</p>
                </div>
            </div>
        );
    }

    const filteredEvents = getFilteredEvents();
    const stats = getEventStats();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
                    <div className="absolute top-0 left-0 w-full h-full">
                        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pastel-400/10 rounded-full animate-pulse blur-3xl"></div>
                        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-pastel-300/10 rounded-full animate-pulse blur-3xl" style={{ animationDelay: '1s' }}></div>
                        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-pastel-500/10 rounded-full animate-pulse blur-3xl" style={{ animationDelay: '2s' }}></div>
                    </div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 py-16 px-4">
                    <div className="max-w-6xl mx-auto text-center">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex justify-center items-center mb-6">
                                <div className="relative">
                                    <FaMoon className="text-pastel-400 text-5xl mr-4 animate-pulse" />
                                    <FaMagic className="text-pastel-300 text-3xl absolute -top-1 -right-1 animate-bounce" />
                                </div>
                                <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-pastel-300 via-pastel-400 to-pastel-500 bg-clip-text text-transparent">
                                    My Events
                                </h1>
                                <div className="relative">
                                    <FaSun className="text-pastel-400 text-5xl ml-4 animate-pulse" />
                                    <FaStar className="text-pastel-300 text-3xl absolute -top-1 -left-1 animate-bounce" />
                                </div>
                            </div>
                        </div>

                        {/* Subtitle */}
                        <div className="mb-8">
                            <p className="text-2xl md:text-3xl font-light text-pastel-200 mb-4">
                                ✨ Quản lý sự kiện của bạn ✨
                            </p>
                            <p className="text-lg md:text-xl text-pastel-300 max-w-3xl mx-auto leading-relaxed">
                                Tạo, quản lý và theo dõi các sự kiện bạn đã tổ chức một cách dễ dàng và hiệu quả
                            </p>
                        </div>

                        {/* CTA Button */}
                        <div className="mb-12">
                            <Link
                                to="/create-event"
                                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-pastel-400 to-pastel-500 text-slate-900 rounded-2xl font-bold text-lg hover:from-pastel-500 hover:to-pastel-600 transition-all duration-500 shadow-2xl hover:shadow-pastel-400/25 transform hover:scale-105"
                            >
                                <FiPlus className="mr-3 text-xl group-hover:rotate-90 transition-transform duration-500" />
                                Tạo sự kiện mới
                            </Link>
                        </div>

                        {/* Scroll Indicator */}
                        <div className="animate-bounce">
                            <div className="w-6 h-10 border-2 border-pastel-400/50 rounded-full flex justify-center mx-auto">
                                <div className="w-1 h-3 bg-pastel-400 rounded-full mt-2 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact Stats Section */}
            <div className="py-12 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-black text-pastel-300 mb-4 flex items-center justify-center">
                            <FaChartLine className="text-pastel-400 mr-4 text-3xl" />
                            Thống kê sự kiện
                        </h2>
                        <p className="text-lg text-pastel-200 max-w-2xl mx-auto">
                            Tổng quan về các sự kiện bạn đã tạo và quản lý
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { icon: FaChartLine, number: stats.total, label: 'Tổng sự kiện', color: 'from-pastel-400 to-pastel-500' },
                            { icon: FiTrendingUp, number: stats.upcoming, label: 'Sắp diễn ra', color: 'from-emerald-400 to-teal-500' },
                            { icon: FiClock, number: stats.past, label: 'Đã qua', color: 'from-blue-400 to-indigo-500' },
                            { icon: FiEdit2, number: stats.draft, label: 'Bản nháp', color: 'from-slate-400 to-gray-500' }
                        ].map((stat, index) => (
                            <div key={index} className="group">
                                <div className={`bg-gradient-to-r ${stat.color} rounded-2xl p-6 mb-4 group-hover:scale-105 transition-all duration-300 shadow-xl group-hover:shadow-pastel-400/25`}>
                                    <stat.icon className="text-3xl mx-auto mb-3 text-white" />
                                </div>
                                <div className="text-2xl md:text-3xl font-black text-pastel-300 mb-2">{stat.number}</div>
                                <div className="text-pastel-200 text-sm font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="py-16 bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="max-w-6xl mx-auto px-4">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-black text-pastel-300 mb-4 flex items-center justify-center">
                            <FaChartLine className="text-pastel-400 mr-4 text-4xl" />
                            Danh sách sự kiện
                        </h2>
                        <p className="text-lg md:text-xl text-pastel-200">
                            Quản lý {filteredEvents.length} sự kiện trong tổng số {events.length} sự kiện
                        </p>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 mb-10 border border-slate-600/30">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pastel-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sự kiện..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-pastel-400 focus:border-transparent text-pastel-200 placeholder-pastel-300/70 backdrop-blur-sm"
                                />
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex items-center space-x-3">
                                <nav className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl backdrop-blur-sm border border-slate-600/30">
                                    {[
                                        { key: 'all', name: 'Tất cả', count: stats.total },
                                        { key: 'upcoming', name: 'Sắp diễn ra', count: stats.upcoming },
                                        { key: 'past', name: 'Đã qua', count: stats.past },
                                        { key: 'draft', name: 'Bản nháp', count: stats.draft }
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setFilter(tab.key)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                                                filter === tab.key
                                                    ? 'bg-gradient-to-r from-pastel-400 to-pastel-500 text-slate-900 shadow-lg'
                                                    : 'text-pastel-300 hover:text-pastel-200 hover:bg-slate-700/50'
                                            }`}
                                        >
                                            {tab.name} ({tab.count})
                                        </button>
                                    ))}
                                </nav>

                                {/* Refresh Button */}
                                <button
                                    onClick={fetchMyEvents}
                                    className="p-3 bg-gradient-to-r from-slate-700 to-slate-600 text-pastel-300 rounded-xl hover:from-slate-600 hover:to-slate-500 transition-all duration-300 shadow-lg border border-slate-600/30"
                                >
                                    <FiRefreshCw className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error State */}
                    {error && (
                        <div className="mb-10 bg-gradient-to-r from-rose-900/50 to-pink-900/50 border border-rose-600/30 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-center">
                                <div className="text-rose-400 text-2xl mr-4">⚠️</div>
                                <div>
                                    <p className="text-rose-200 font-bold">{error}</p>
                                    <button
                                        onClick={fetchMyEvents}
                                        className="mt-2 text-rose-300 hover:text-rose-200 underline font-medium"
                                    >
                                        Thử lại
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Events Display */}
                    {filteredEvents.length === 0 ? (
                        <div className="text-center py-16 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl shadow-2xl backdrop-blur-sm border border-slate-600/30">
                            <div className="text-6xl mb-4">😔</div>
                            <h3 className="text-2xl font-black text-pastel-300 mb-4">Chưa có sự kiện nào</h3>
                            <p className="text-lg text-pastel-200 mb-8 max-w-xl mx-auto">
                                {filter === 'all' 
                                    ? 'Bắt đầu bằng cách tạo sự kiện đầu tiên của bạn'
                                    : `Không có sự kiện nào trong danh mục "${filter === 'upcoming' ? 'sắp diễn ra' : filter === 'past' ? 'đã qua' : 'bản nháp'}"`
                                }
                            </p>
                            {filter === 'all' && (
                                <Link
                                    to="/create-event"
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pastel-400 to-pastel-500 text-slate-900 rounded-xl font-bold text-base hover:from-pastel-500 hover:to-pastel-600 transition-all duration-300 shadow-2xl hover:shadow-pastel-400/25 transform hover:scale-105"
                                >
                                    <FiPlus className="mr-2 h-5 w-5" />
                                    Tạo sự kiện mới
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Events Grid - 3 cards per row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredEvents.map((event) => (
                                    <div key={event._id} className="relative group">
                                        {/* Status Badge Overlay */}
                                        <div className="absolute top-3 right-3 z-20">
                                            {getStatusBadge(event.status)}
                                        </div>
                                        
                                        {/* Event Card with custom styling */}
                                        <div className="relative">
                                            <EventCard event={event} size="normal" />
                                            
                                            {/* Custom overlay for dark theme */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent rounded-xl pointer-events-none"></div>
                                        </div>
                                        
                                        {/* Action Buttons Overlay */}
                                        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-500 z-30">
                                            <div className="flex justify-center space-x-1">
                                                <Link
                                                    to={`/events/${event._id}`}
                                                    className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-lg hover:from-blue-500 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-blue-400/25 transform hover:scale-110"
                                                    title="Xem chi tiết"
                                                >
                                                    <FaEye className="h-3 w-3" />
                                                </Link>
                                                <Link
                                                    to={`/events/${event._id}/manage`}
                                                    className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-pastel-400 to-pastel-500 text-slate-900 rounded-lg hover:from-pastel-500 hover:to-pastel-600 transition-all duration-300 shadow-lg hover:shadow-pastel-400/25 transform hover:scale-110"
                                                    title="Chỉnh sửa"
                                                >
                                                    <FaEdit className="h-3 w-3" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteEvent(event._id)}
                                                    className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-lg hover:from-rose-500 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-rose-400/25 transform hover:scale-110"
                                                    title="Xóa sự kiện"
                                                >
                                                    <FaTrash className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyEvents; 