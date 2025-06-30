import React, { useState, useEffect } from 'react';
import { ticketService } from '../services/ticketService';
import { toast } from 'react-toastify';
import QRCode from 'qrcode';
import { useSearchParams } from 'react-router-dom';

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

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await ticketService.getUserTickets();
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
                    const qrData = JSON.stringify({
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
            setError('Không thể tải vé của bạn. Vui lòng thử lại sau.');
            toast.error('Không thể tải vé của bạn.');
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
                toast.info(`💰 Số tiền hoàn: ${refundAmount.toLocaleString()} VNĐ\n💸 Phí xử lý: ${feeAmount.toLocaleString()} VNĐ`, {
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
        const refundAmount = price * 0.75;
        const feeAmount = price * 0.25;
        return { refundAmount, feeAmount };
    };
    
    const isReturnable = (ticket) => {
        if (!ticket.event || !ticket.event.startDate) return false;
        const eventDate = new Date(ticket.event.startDate);
        const now = new Date();
        const hoursDifference = (eventDate - now) / (1000 * 60 * 60);
        return hoursDifference >= 24;
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
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
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'returned': return 'bg-red-100 text-red-800';
            case 'used': return 'bg-gray-100 text-gray-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'Có hiệu lực';
            case 'returned': return 'Đã trả';
            case 'used': return 'Đã sử dụng';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="container mx-auto p-8 text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-red-800 mb-2">Có lỗi xảy ra</h2>
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto p-4 md:p-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Vé Của Tôi</h1>
                    <p className="text-gray-600">Quản lý và xem chi tiết các vé sự kiện của bạn</p>
                </div>

                {tickets.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="mb-4">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có vé nào</h3>
                        <p className="text-gray-500">Bạn chưa mua vé cho sự kiện nào. Hãy khám phá các sự kiện thú vị!</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {tickets.map(ticket => {
                            const dateTime = formatDateTime(ticket.event?.startDate);
                            const isNewTicket = newTickets.includes(ticket._id);
                            return (
                                <div 
                                    key={ticket._id} 
                                    className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 ${
                                        ticket.status === 'returned' ? 'opacity-60' : ''
                                    } ${isNewTicket ? 'ring-2 ring-blue-500 animate-pulse' : ''}`}
                                    onClick={() => setSelectedTicket(ticket)}
                                >
                                    {/* Ticket Header */}
                                    <div className="relative">
                                        <img 
                                            src={ticket.event?.images?.[0] || 'https://via.placeholder.com/400x200'} 
                                            alt="Event" 
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="absolute top-4 right-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                                                {getStatusText(ticket.status)}
                                            </span>
                                        </div>
                                        
                                        {/* Highlight for new tickets */}
                                        {isNewTicket && (
                                            <div className="absolute top-4 left-4">
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                    Vé mới
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* Perforated edge effect */}
                                        <div 
                                            className="absolute bottom-0 left-0 right-0 h-6 bg-white" 
                                            style={{
                                                clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'
                                            }}
                                        />
                                    </div>

                                    {/* Ticket Body */}
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                                    {ticket.event?.title}
                                                </h2>
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    <p className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        {dateTime.date}
                                                    </p>
                                                    <p className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {dateTime.time}
                                                    </p>
                                                    <p className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        {ticket.event?.venue || 'Chưa xác định'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Mini QR Code */}
                                            {qrCodes[ticket._id] && (
                                                <div className="ml-4">
                                                    <img 
                                                        src={qrCodes[ticket._id]} 
                                                        alt="QR Code" 
                                                        className="w-16 h-16 border rounded"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Seat Information */}
                                        {ticket.seatNumber && (
                                            <div className="bg-blue-50 rounded-lg p-3 mb-4">
                                                <div className="flex items-center text-blue-800">
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                    </svg>
                                                    <span className="font-semibold">
                                                        {ticket.section} - Ghế {ticket.seatNumber}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Price */}
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-2xl font-bold text-green-600">
                                                {ticket.price.toLocaleString()} VNĐ
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                #{ticket._id.slice(-8)}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        {ticket.status === 'active' && isReturnable(ticket) && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openReturnModal(ticket);
                                                }}
                                                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                                            >
                                                Trả vé (Phí 25%)
                                            </button>
                                        )}
                                        {ticket.status === 'active' && !isReturnable(ticket) && (
                                            <div className="text-center text-sm text-gray-500 py-2">
                                                Đã quá hạn trả vé (dưới 24 tiếng trước sự kiện)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Return Ticket Modal */}
            {showReturnModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full">
                                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                                Xác nhận trả vé
                            </h3>
                            
                            <div className="mb-6">
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">{showReturnModal.event?.title}</h4>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>📅 {formatDateTime(showReturnModal.event?.startDate).date}</p>
                                        <p>🕐 {formatDateTime(showReturnModal.event?.startDate).time}</p>
                                        {showReturnModal.seatNumber && (
                                            <p>🪑 {showReturnModal.section} - Ghế {showReturnModal.seatNumber}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 mb-4">
                                    <div className="text-sm">
                                        <h5 className="font-semibold text-yellow-800 mb-2">Thông tin hoàn tiền:</h5>
                                        <div className="space-y-1 text-yellow-700">
                                            <div className="flex justify-between">
                                                <span>Giá gốc:</span>
                                                <span className="font-semibold">{showReturnModal.price.toLocaleString()} VNĐ</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Phí xử lý (25%):</span>
                                                <span className="font-semibold text-red-600">-{calculateRefund(showReturnModal.price).feeAmount.toLocaleString()} VNĐ</span>
                                            </div>
                                            <div className="border-t border-yellow-300 pt-1 mt-2">
                                                <div className="flex justify-between">
                                                    <span className="font-semibold">Số tiền hoàn:</span>
                                                    <span className="font-bold text-green-600">{calculateRefund(showReturnModal.price).refundAmount.toLocaleString()} VNĐ</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-800">
                                        💡 <strong>Lưu ý:</strong> Số tiền hoàn sẽ được thêm vào ví điện tử của bạn và có thể sử dụng cho các giao dịch tiếp theo.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex space-x-3">
                                <button 
                                    onClick={() => setShowReturnModal(null)}
                                    disabled={isReturning}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button 
                                    onClick={() => handleReturnTicket(showReturnModal._id)}
                                    disabled={isReturning}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isReturning ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-screen overflow-y-auto">
                        {/* Modal Header */}
                        <div className="relative">
                            <img 
                                src={selectedTicket.event?.images?.[0] || 'https://via.placeholder.com/400x200'} 
                                alt="Event" 
                                className="w-full h-48 object-cover rounded-t-2xl"
                            />
                            <button 
                                onClick={() => setSelectedTicket(null)}
                                className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Event Title */}
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {selectedTicket.event?.title}
                            </h2>

                            {/* QR Code */}
                            {qrCodes[selectedTicket._id] && (
                                <div className="text-center mb-6">
                                    <img 
                                        src={qrCodes[selectedTicket._id]} 
                                        alt="QR Code" 
                                        className="w-32 h-32 mx-auto border rounded-lg"
                                    />
                                    <p className="text-sm text-gray-500 mt-2">Quét mã QR tại cổng vào</p>
                                </div>
                            )}

                            {/* Ticket Details */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày</label>
                                        <p className="text-sm font-medium">{formatDateTime(selectedTicket.event?.startDate).date}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Giờ</label>
                                        <p className="text-sm font-medium">{formatDateTime(selectedTicket.event?.startDate).time}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Địa điểm</label>
                                    <p className="text-sm font-medium">{selectedTicket.event?.venue || 'Chưa xác định'}</p>
                                </div>

                                {selectedTicket.seatNumber && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ghế ngồi</label>
                                        <p className="text-sm font-medium">{selectedTicket.section} - Ghế {selectedTicket.seatNumber}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Giá vé</label>
                                        <p className="text-lg font-bold text-green-600">{selectedTicket.price.toLocaleString()} VNĐ</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</label>
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedTicket.status)}`}>
                                            {getStatusText(selectedTicket.status)}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mã vé</label>
                                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">#{selectedTicket._id}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 space-y-3">
                                {selectedTicket.status === 'active' && isReturnable(selectedTicket) && (
                                    <button 
                                        onClick={() => {
                                            setSelectedTicket(null);
                                            openReturnModal(selectedTicket);
                                        }}
                                        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                                    >
                                        Trả vé (Phí 25%)
                                    </button>
                                )}
                                <button 
                                    onClick={() => setSelectedTicket(null)}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
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