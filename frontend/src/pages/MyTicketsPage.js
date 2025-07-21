import React, { useState, useEffect } from 'react';
import { ticketService } from '../services/ticketService';
import { toast } from 'react-toastify';
import QRCode from 'qrcode';
import { useSearchParams } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTicketAlt, FaQrcode, FaTimes, FaExclamationTriangle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

const MyTicketsPage = () => {
    const [searchParams] = useSearchParams();
    const paymentId = searchParams.get('payment');
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [qrCodes, setQrCodes] = useState({});
    const [showReturnModal, setShowReturnModal] = useState(null);
    const [isReturning, setIsReturning] = useState(false);
    const [newTickets, setNewTickets] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('all');

    const fetchTickets = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await ticketService.getUserTickets();
            
            if (!response.data) {
                setTickets([]);
                return;
            }
            
            setTickets(response.data);
            
            // Nếu có payment ID, tìm các vé mới mua
            if (paymentId) {
                const newlyPurchased = response.data.filter(ticket => ticket.paymentId === paymentId);
                setNewTickets(newlyPurchased.map(ticket => ticket._id));
                
                // Hiển thị thông báo
                if (newlyPurchased.length > 0) {
                    toast.success(`Đã mua thành công ${newlyPurchased.length} vé!`);
                }
            }
            
            // Generate QR codes for all tickets
            const qrCodePromises = response.data.map(async (ticket) => {
                try {
                    const qrData = ticket.qrCode || JSON.stringify({
                        ticketId: ticket._id,
                        eventId: ticket.event?._id,
                        userId: ticket.userId,
                        seatInfo: ticket.seatNumber ? `${ticket.section} - Ghế ${ticket.seatNumber}` : 'Vé tổng quát'
                    });
                    const qrCodeDataURL = await QRCode.toDataURL(qrData);
                    return { ticketId: ticket._id, qrCode: qrCodeDataURL };
                } catch (err) {
                    console.error('Error generating QR code:', err);
                    return { ticketId: ticket._id, qrCode: null };
                }
            });
            
            const qrResults = await Promise.all(qrCodePromises);
            const qrCodeMap = {};
            qrResults.forEach(result => {
                qrCodeMap[result.ticketId] = result.qrCode;
            });
            setQrCodes(qrCodeMap);
        } catch (err) {
            console.error('Error fetching tickets:', err);
            setError('Không thể tải vé của bạn. Vui lòng thử lại sau.');
            toast.error('Không thể tải vé của bạn. Vui lòng kiểm tra kết nối mạng hoặc đăng nhập lại.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [paymentId]);

    const handleReturnTicket = async (ticketId) => {
        setIsReturning(true);
        try {
            const response = await ticketService.returnTicket(ticketId);
            toast.success(response.data.message);
            
            // Instead of updating local state, refetch from server to ensure consistency
            await fetchTickets();
            setShowReturnModal(null);
            
            // Show detailed success message
            const refundAmount = response.data.refundAmount;
            const feeAmount = response.data.feeAmount;
            setTimeout(() => {
                toast.info(`💰 Số tiền hoàn: ${refundAmount !== undefined && refundAmount !== null ? refundAmount.toLocaleString() : 'N/A'} VNĐ\n💸 Phí xử lý: ${feeAmount !== undefined && feeAmount !== null ? feeAmount.toLocaleString() : 'N/A'} VNĐ`, {
                    autoClose: 5000
                });
            }, 1000);
            
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Lỗi khi trả vé.';
            toast.error(errorMessage);
        } finally {
            setIsReturning(false);
        }
    };

    const openReturnModal = (ticket) => {
        setShowReturnModal(ticket);
    };

    const calculateRefund = (price) => {
        const feeAmount = price * 0.25;
        const refundAmount = price - feeAmount;
        return { refundAmount, feeAmount };
    };

    const canReturnTicket = (ticket) => {
        if (!ticket.event?.startDate) return false;
        const eventDate = new Date(ticket.event.startDate);
        const now = new Date();
        const hoursUntilEvent = (eventDate - now) / (1000 * 60 * 60);
        return hoursUntilEvent > 24;
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return { date: 'Chưa có ngày', time: 'Chưa có giờ' };
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return { date: 'Chưa có ngày', time: 'Chưa có giờ' };
            
            return {
                date: date.toLocaleDateString('vi-VN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }),
                time: date.toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })
            };
        } catch (e) {
            return { date: 'Chưa có ngày', time: 'Chưa có giờ' };
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
            case 'pending': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
            case 'returned': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
            case 'cancelled': return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
            case 'used': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
            default: return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'Có hiệu lực';
            case 'pending': return 'Chờ xác nhận';
            case 'returned': return 'Đã trả';
            case 'cancelled': return 'Đã hủy';
            case 'used': return 'Đã sử dụng';
            default: return status;
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        return selectedStatus === 'all' || ticket.status === selectedStatus;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-blue-300 text-lg">Đang tải vé của bạn...</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="text-red-400 text-4xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-red-300 mb-2">Có lỗi xảy ra</h2>
                    <p className="text-red-200 mb-6">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 font-semibold py-3 px-6 rounded-xl border border-blue-500/30 transition-all duration-300"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            {/* Header Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20"></div>
                <div className="relative z-10 container mx-auto px-4 py-12">
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-4">
                            Vé Của Tôi
                        </h1>
                        <p className="text-blue-300 text-lg bg-gray-800/50 backdrop-blur-sm rounded-xl px-6 py-3 border border-blue-500/30 inline-block">
                            🎫 Quản lý và xem chi tiết các vé sự kiện của bạn
                        </p>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-blue-400">{tickets.length}</div>
                            <div className="text-blue-300 text-sm">Tổng vé</div>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-green-400">
                                {tickets.filter(t => t.status === 'active').length}
                            </div>
                            <div className="text-green-300 text-sm">Có hiệu lực</div>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-400">
                                {tickets.filter(t => t.status === 'pending').length}
                            </div>
                            <div className="text-yellow-300 text-sm">Chờ xác nhận</div>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-purple-400">
                                {tickets.filter(t => t.status === 'used').length}
                            </div>
                            <div className="text-purple-300 text-sm">Đã sử dụng</div>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 mb-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center">
                                <FaTicketAlt className="text-blue-400 mr-3 text-xl" />
                                <span className="text-blue-200 font-medium">Lọc theo trạng thái:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { key: 'all', label: 'Tất cả', icon: '🎫' },
                                    { key: 'active', label: 'Có hiệu lực', icon: '✅' },
                                    { key: 'pending', label: 'Chờ xác nhận', icon: '⏳' },
                                    { key: 'returned', label: 'Đã trả', icon: '↩️' },
                                    { key: 'cancelled', label: 'Đã hủy', icon: '❌' },
                                    { key: 'used', label: 'Đã sử dụng', icon: '🎭' }
                                ].map(filter => (
                                    <button
                                        key={filter.key}
                                        onClick={() => setSelectedStatus(filter.key)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                                            selectedStatus === filter.key 
                                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25' 
                                                : 'bg-gray-700/50 text-blue-200 hover:bg-gray-600/50 border border-blue-500/30'
                                        }`}
                                    >
                                        <span className="mr-2">{filter.icon}</span>
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {tickets.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="bg-gray-800/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-12 max-w-md mx-auto">
                                <div className="text-6xl mb-6">🎫</div>
                                <h3 className="text-2xl font-bold text-blue-200 mb-4">Chưa có vé nào</h3>
                                <p className="text-blue-300/80 mb-6">
                                    Bạn chưa mua vé cho sự kiện nào. Hãy khám phá các sự kiện thú vị!
                                </p>
                                <button className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25">
                                    🎪 Khám phá sự kiện
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredTickets.map(ticket => {
                                const dateTime = formatDateTime(ticket.event?.startDate);
                                const isNewTicket = newTickets.includes(ticket._id);
                                return (
                                    <div 
                                        key={ticket._id} 
                                        className={`group bg-gray-800/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl overflow-hidden hover:border-blue-400/40 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                                            ticket.status === 'returned' ? 'opacity-60' : ''
                                        } ${isNewTicket ? 'ring-2 ring-blue-500 animate-pulse' : ''}`}
                                        onClick={() => setSelectedTicket(ticket)}
                                    >
                                        {/* Ticket Header */}
                                        <div className="relative">
                                            <img 
                                                src={
                                                    (() => {
                                                        // Handle old format: event.images = {logo: "url", banner: "url"}
                                                        if (ticket.event?.images && typeof ticket.event.images === 'object' && !Array.isArray(ticket.event.images)) {
                                                            const imageUrl = ticket.event.images.banner || ticket.event.images.logo;
                                                            if (imageUrl) {
                                                                return imageUrl.startsWith('http') 
                                                                    ? imageUrl 
                                                                    : `http://localhost:5001${imageUrl}`;
                                                            }
                                                        }
                                                        
                                                        // Handle new format: event.images = ["/uploads/events/filename.jpg"]
                                                        if (ticket.event?.images && Array.isArray(ticket.event.images) && ticket.event.images.length > 0) {
                                                            const imageUrl = ticket.event.images[0];
                                                            return imageUrl.startsWith('http') 
                                                                ? imageUrl 
                                                                : `http://localhost:5001${imageUrl}`;
                                                        }
                                                        
                                                        // Fallback to default image
                                                        return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
                                                    })()
                                                }
                                                alt="Event" 
                                                className="w-full h-64 md:h-72 lg:h-80 object-cover group-hover:scale-110 transition-transform duration-300"
                                                onError={(e) => {
                                                    e.target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            
                                            {/* Status Badge */}
                                            <div className="absolute top-4 right-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)} shadow-lg`}>
                                                    {getStatusText(ticket.status)}
                                                </span>
                                            </div>
                                            
                                            {/* New Ticket Badge */}
                                            {isNewTicket && (
                                                <div className="absolute top-4 left-4">
                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                                                        ✨ Vé mới
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {/* QR Code Preview */}
                                            {qrCodes[ticket._id] && (
                                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                                                        <img 
                                                            src={qrCodes[ticket._id]} 
                                                            alt="QR Code" 
                                                            className="w-12 h-12"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Ticket Body */}
                                        <div className="p-6">
                                            <div className="mb-4">
                                                <h2 className="text-xl font-bold text-blue-200 mb-3 line-clamp-2 group-hover:text-blue-300 transition-colors duration-300">
                                                    {ticket.event?.title}
                                                </h2>
                                                
                                                <div className="space-y-2 text-sm text-blue-300/80">
                                                    {dateTime.date !== 'Chưa có ngày' && (
                                                        <div className="flex items-center">
                                                            <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                                                                <FaCalendarAlt className="text-blue-400 text-xs" />
                                                            </div>
                                                            <span className="line-clamp-1">{dateTime.date}</span>
                                                        </div>
                                                    )}
                                                    {dateTime.time !== 'Chưa có giờ' && (
                                                        <div className="flex items-center">
                                                            <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                                                                <FaClock className="text-blue-400 text-xs" />
                                                            </div>
                                                            <span>{dateTime.time}</span>
                                                        </div>
                                                    )}
                                                    {ticket.event?.location?.venueName && (
                                                        <div className="flex items-center">
                                                            <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                                                                <FaMapMarkerAlt className="text-blue-400 text-xs" />
                                                            </div>
                                                            <span className="line-clamp-1">
                                                                {ticket.event.location.type === 'online' 
                                                                    ? '🌐 Trực tuyến'
                                                                    : ticket.event.location.venueName
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Seat Information */}
                                            {ticket.seatNumber && (
                                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4">
                                                    <div className="flex items-center text-blue-300">
                                                        <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                                                            <FaTicketAlt className="text-blue-400 text-xs" />
                                                        </div>
                                                        <span className="font-semibold">
                                                            {ticket.section} - Ghế {ticket.seatNumber}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Price and Actions */}
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className="text-2xl font-bold text-green-400">
                                                        {ticket.price.toLocaleString()} VNĐ
                                                    </span>
                                                    <div className="text-xs text-blue-300/60">
                                                        #{ticket._id.slice(-8)}
                                                    </div>
                                                </div>
                                                
                                                {ticket.status === 'active' && canReturnTicket(ticket) && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openReturnModal(ticket);
                                                        }}
                                                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25"
                                                    >
                                                        Trả vé
                                                    </button>
                                                )}
                                                {ticket.status === 'active' && !canReturnTicket(ticket) && (
                                                    <div className="text-center text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                                                        ⏰ Đã quá hạn trả vé
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Return Ticket Modal */}
            {showReturnModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800/90 backdrop-blur-sm border border-blue-500/30 rounded-2xl max-w-md w-full shadow-2xl shadow-blue-500/20">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                                <FaExclamationTriangle className="w-8 h-8 text-yellow-400" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-blue-200 text-center mb-4">
                                Xác nhận trả vé
                            </h3>
                            
                            <div className="mb-6">
                                <div className="bg-gray-700/50 border border-blue-500/30 rounded-xl p-4 mb-4">
                                    <h4 className="font-semibold text-blue-200 mb-2">{showReturnModal.event?.title}</h4>
                                    <div className="text-sm text-blue-300/80 space-y-1">
                                        <p>📅 {formatDateTime(showReturnModal.event?.startDate).date}</p>
                                        <p>🕐 {formatDateTime(showReturnModal.event?.startDate).time}</p>
                                        {showReturnModal.seatNumber && (
                                            <p>🪑 {showReturnModal.section} - Ghế {showReturnModal.seatNumber}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="border-l-4 border-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
                                    <div className="text-sm">
                                        <h5 className="font-semibold text-yellow-300 mb-2">Thông tin hoàn tiền:</h5>
                                        <div className="space-y-1 text-yellow-200">
                                            <div className="flex justify-between">
                                                <span>Giá gốc:</span>
                                                <span className="font-semibold">{showReturnModal.price.toLocaleString()} VNĐ</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Phí xử lý (25%):</span>
                                                <span className="font-semibold text-red-400">-{calculateRefund(showReturnModal.price).feeAmount.toLocaleString()} VNĐ</span>
                                            </div>
                                            <div className="border-t border-yellow-500/30 pt-1 mt-2">
                                                <div className="flex justify-between">
                                                    <span className="font-semibold">Số tiền hoàn:</span>
                                                    <span className="font-bold text-green-400">{calculateRefund(showReturnModal.price).refundAmount.toLocaleString()} VNĐ</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                                    <p className="text-sm text-blue-300">
                                        💡 <strong>Lưu ý:</strong> Số tiền hoàn sẽ được thêm vào ví điện tử của bạn và có thể sử dụng cho các giao dịch tiếp theo.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex space-x-3">
                                <button 
                                    onClick={() => setShowReturnModal(null)}
                                    disabled={isReturning}
                                    className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-blue-200 font-semibold py-3 px-4 rounded-xl border border-blue-500/30 transition-all duration-300 disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button 
                                    onClick={() => handleReturnTicket(showReturnModal._id)}
                                    disabled={isReturning}
                                    className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center shadow-lg hover:shadow-red-500/25"
                                >
                                    {isReturning ? (
                                        <>
                                            <div className="animate-spin -ml-1 mr-2 h-4 w-4 text-white border-2 border-white border-t-transparent rounded-full"></div>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        'Xác nhận trả vé'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800/90 backdrop-blur-sm border border-blue-500/30 rounded-2xl max-w-md w-full max-h-screen overflow-y-auto shadow-2xl shadow-blue-500/20">
                        {/* Modal Header */}
                        <div className="relative">
                            <img 
                                src={
                                    (() => {
                                        // Handle old format: event.images = {logo: "url", banner: "url"}
                                        if (selectedTicket.event?.images && typeof selectedTicket.event.images === 'object' && !Array.isArray(selectedTicket.event.images)) {
                                            const imageUrl = selectedTicket.event.images.banner || selectedTicket.event.images.logo;
                                            if (imageUrl) {
                                                return imageUrl.startsWith('http') 
                                                    ? imageUrl 
                                                    : `http://localhost:5001${imageUrl}`;
                                            }
                                        }
                                        
                                        // Handle new format: event.images = ["/uploads/events/filename.jpg"]
                                        if (selectedTicket.event?.images && Array.isArray(selectedTicket.event.images) && selectedTicket.event.images.length > 0) {
                                            const imageUrl = selectedTicket.event.images[0];
                                            return imageUrl.startsWith('http') 
                                                ? imageUrl 
                                                : `http://localhost:5001${imageUrl}`;
                                        }
                                        
                                        // Fallback to default image
                                        return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
                                    })()
                                }
                                alt="Event" 
                                className="w-full h-64 md:h-72 object-cover rounded-t-2xl"
                                onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
                                }}
                            />
                            <button 
                                onClick={() => setSelectedTicket(null)}
                                className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white rounded-full p-2 hover:bg-black/70 transition-all duration-300"
                            >
                                <FaTimes className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Event Title */}
                            <h2 className="text-2xl font-bold text-blue-200 mb-4">
                                {selectedTicket.event?.title}
                            </h2>

                            {/* QR Code */}
                            {qrCodes[selectedTicket._id] && (
                                <div className="text-center mb-6">
                                    <div className="bg-white/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 inline-block">
                                        <img 
                                            src={qrCodes[selectedTicket._id]} 
                                            alt="QR Code" 
                                            className="w-32 h-32 mx-auto"
                                        />
                                    </div>
                                    <p className="text-sm text-blue-300/80 mt-2">Quét mã QR tại cổng vào</p>
                                </div>
                            )}

                            {/* Ticket Details */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-700/30 border border-blue-500/20 rounded-xl p-3">
                                        <label className="text-xs font-semibold text-blue-300/60 uppercase tracking-wide">Ngày</label>
                                        <p className="text-sm font-medium text-blue-200">{formatDateTime(selectedTicket.event?.startDate).date}</p>
                                    </div>
                                    <div className="bg-gray-700/30 border border-blue-500/20 rounded-xl p-3">
                                        <label className="text-xs font-semibold text-blue-300/60 uppercase tracking-wide">Giờ</label>
                                        <p className="text-sm font-medium text-blue-200">{formatDateTime(selectedTicket.event?.startDate).time}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-700/30 border border-blue-500/20 rounded-xl p-3">
                                    <label className="text-xs font-semibold text-blue-300/60 uppercase tracking-wide">Địa điểm</label>
                                    <p className="text-sm font-medium text-blue-200">
                                        {selectedTicket.event?.location?.venueName || selectedTicket.event?.venue || 'Chưa xác định'}
                                    </p>
                                </div>

                                {selectedTicket.seatNumber && (
                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                                        <label className="text-xs font-semibold text-blue-300/60 uppercase tracking-wide">Ghế ngồi</label>
                                        <p className="text-sm font-medium text-blue-200">{selectedTicket.section} - Ghế {selectedTicket.seatNumber}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-700/30 border border-blue-500/20 rounded-xl p-3">
                                        <label className="text-xs font-semibold text-blue-300/60 uppercase tracking-wide">Giá vé</label>
                                        <p className="text-lg font-bold text-green-400">{selectedTicket.price.toLocaleString()} VNĐ</p>
                                    </div>
                                    <div className="bg-gray-700/30 border border-blue-500/20 rounded-xl p-3">
                                        <label className="text-xs font-semibold text-blue-300/60 uppercase tracking-wide">Trạng thái</label>
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedTicket.status)}`}>
                                            {getStatusText(selectedTicket.status)}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-700/30 border border-blue-500/20 rounded-xl p-3">
                                    <label className="text-xs font-semibold text-blue-300/60 uppercase tracking-wide">Mã vé</label>
                                    <p className="text-sm font-mono bg-gray-800/50 p-2 rounded-lg text-blue-200 border border-blue-500/20">#{selectedTicket._id}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 space-y-3">
                                {selectedTicket.status === 'active' && canReturnTicket(selectedTicket) && (
                                    <button 
                                        onClick={() => {
                                            setSelectedTicket(null);
                                            openReturnModal(selectedTicket);
                                        }}
                                        className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-red-500/25"
                                    >
                                        Trả vé (Phí 25%)
                                    </button>
                                )}
                                <button 
                                    onClick={() => setSelectedTicket(null)}
                                    className="w-full bg-gray-700/50 hover:bg-gray-600/50 text-blue-200 font-semibold py-3 px-4 rounded-xl border border-blue-500/30 transition-all duration-300"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTicketsPage; 