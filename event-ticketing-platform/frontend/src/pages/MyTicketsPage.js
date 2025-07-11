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
    const [selectedStatus, setSelectedStatus] = useState('all');

    const fetchTickets = async () => {
        try {
            setLoading(true);
            setError('');
            console.log('Fetching tickets...');
            
            const response = await ticketService.getUserTickets();
            
            console.log('Received ticket data:', response?.data?.length || 0, 'tickets');
            
            if (!response || !response.data) {
                console.log('No data received from API');
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
            if (response.data.length > 0) {
                console.log('Generating QR codes...');
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
            }
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Đang tải thông tin vé...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="container mx-auto p-8 text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-red-800 mb-2">Có lỗi xảy ra</h2>
                    <p className="text-red-600">{error}</p>
                    <button 
                        onClick={fetchTickets}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                        Thử lại
                    </button>
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

                {/* Filter Bar */}
                <div className="mb-6 bg-white rounded-lg shadow p-4">
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-700 font-medium">Lọc theo trạng thái:</span>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedStatus('all')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 
                                    ${selectedStatus === 'all' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => setSelectedStatus('active')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 
                                    ${selectedStatus === 'active' 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Có hiệu lực
                            </button>
                            <button
                                onClick={() => setSelectedStatus('pending')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 
                                    ${selectedStatus === 'pending' 
                                        ? 'bg-yellow-500 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Chờ xác nhận
                            </button>
                            <button
                                onClick={() => setSelectedStatus('returned')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 
                                    ${selectedStatus === 'returned' 
                                        ? 'bg-red-500 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Đã trả
                            </button>
                            <button
                                onClick={() => setSelectedStatus('cancelled')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 
                                    ${selectedStatus === 'cancelled' 
                                        ? 'bg-gray-500 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Đã hủy
                            </button>
                            <button
                                onClick={() => setSelectedStatus('used')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 
                                    ${selectedStatus === 'used' 
                                        ? 'bg-gray-500 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Đã sử dụng
                            </button>
                        </div>
                    </div>
                </div>

                {/* Ticket List */}
                {tickets.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Bạn chưa có vé nào</h3>
                        <p className="text-gray-500 mb-4">Hãy tìm và đặt vé cho các sự kiện bạn quan tâm</p>
                        <a href="/events" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            Khám phá sự kiện
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Ticket items will be rendered here */}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTicketsPage; 