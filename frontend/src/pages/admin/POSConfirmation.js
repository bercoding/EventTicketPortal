import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle, FaSearch, FaFilter, FaPrint, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const POSConfirmation = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [posPayments, setPosPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchPOSPayments();
    }, []);

    const fetchPOSPayments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/payments/pos');
            setPosPayments(response.data.payments || []);
        } catch (error) {
            console.error('Error fetching POS payments:', error);
            toast.error('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const confirmPayment = async (paymentId) => {
        try {
            const response = await api.put(`/payments/pos/${paymentId}/confirm`);
            if (response.data.status === 'success') {
                toast.success('Xác nhận thanh toán thành công!');
                
                // Tìm payment để lấy thông tin user
                const payment = posPayments.find(p => p._id === paymentId);
                if (payment) {
                    // Chuyển hướng khách hàng đến trang vé của họ
                    window.open(`/my-tickets?payment=${paymentId}`, '_blank');
                }
                
                fetchPOSPayments(); // Refresh list
            }
        } catch (error) {
            console.error('Error confirming payment:', error);
            toast.error('Lỗi khi xác nhận thanh toán');
        }
    };

    const cancelPayment = async (paymentId) => {
        try {
            const response = await api.put(`/payments/pos/${paymentId}/cancel`);
            if (response.data.status === 'success') {
                toast.success('Hủy thanh toán thành công!');
                fetchPOSPayments(); // Refresh list
            }
        } catch (error) {
            console.error('Error canceling payment:', error);
            toast.error('Lỗi khi hủy thanh toán');
        }
    };

    const filteredPayments = posPayments.filter(payment => {
        const matchesSearch = payment.pos_TxnRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            payment.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            payment.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterStatus === 'all' || payment.status === filterStatus;
        
        return matchesSearch && matchesFilter;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Chờ thanh toán</span>;
            case 'success':
                return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Đã thanh toán</span>;
            case 'cancelled':
                return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Đã hủy</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Không xác định</span>;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">🏪 Quản lý Thanh toán POS</h1>
                        <p className="text-gray-600 mt-2">Xác nhận và quản lý các giao dịch thanh toán tại quầy POS</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                            {posPayments.length}
                        </div>
                        <div className="text-sm text-gray-500">Tổng giao dịch</div>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo mã giao dịch, email, tên sự kiện..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="pending">Chờ thanh toán</option>
                            <option value="success">Đã thanh toán</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                        <button
                            onClick={fetchPOSPayments}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FaFilter className="inline mr-2" />
                            Làm mới
                        </button>
                    </div>
                </div>
            </div>

            {/* Payments List */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mã giao dịch
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Khách hàng
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sự kiện
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Số tiền
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày tạo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <div className="text-6xl mb-4">🏪</div>
                                            <div className="text-xl font-medium mb-2">Không có giao dịch POS nào</div>
                                            <div className="text-sm">Chưa có giao dịch thanh toán POS nào được tạo</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{payment.pos_TxnRef}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{payment.userEmail}</div>
                                            <div className="text-sm text-gray-500">{payment.userName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{payment.eventTitle}</div>
                                            <div className="text-sm text-gray-500">{payment.bookingType}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatCurrency(payment.totalAmount)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(payment.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(payment.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {payment.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => confirmPayment(payment._id)}
                                                        className="text-green-600 hover:text-green-900 mr-4"
                                                    >
                                                        <FaCheckCircle className="inline mr-1" />
                                                        Xác nhận
                                                    </button>
                                                    <button
                                                        onClick={() => cancelPayment(payment._id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <FaTimesCircle className="inline mr-1" />
                                                        Hủy
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Detail Modal */}
            {showModal && selectedPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Chi tiết giao dịch POS</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mã giao dịch</label>
                                    <div className="mt-1 text-sm text-gray-900 font-mono">{selectedPayment.pos_TxnRef}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                                    <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Khách hàng</label>
                                    <div className="mt-1 text-sm text-gray-900">{selectedPayment.userEmail}</div>
                                    <div className="text-sm text-gray-500">{selectedPayment.userName}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Số tiền</label>
                                    <div className="mt-1 text-lg font-bold text-gray-900">
                                        {formatCurrency(selectedPayment.totalAmount)}
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Sự kiện</label>
                                <div className="mt-1 text-sm text-gray-900">{selectedPayment.eventTitle}</div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Loại đặt vé</label>
                                    <div className="mt-1 text-sm text-gray-900">{selectedPayment.bookingType}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                                    <div className="mt-1 text-sm text-gray-900">{formatDate(selectedPayment.createdAt)}</div>
                                </div>
                            </div>
                            
                            {selectedPayment.selectedSeats && selectedPayment.selectedSeats.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ghế đã chọn</label>
                                    <div className="mt-1">
                                        {selectedPayment.selectedSeats.map((seat, index) => (
                                            <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2 text-sm">
                                                {seat.sectionName} - {seat.seatNumber || 'N/A'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {selectedPayment.selectedTickets && selectedPayment.selectedTickets.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Vé đã chọn</label>
                                    <div className="mt-1">
                                        {selectedPayment.selectedTickets.map((ticket, index) => (
                                            <div key={index} className="bg-gray-50 p-2 rounded mb-2">
                                                <div className="text-sm font-medium">{ticket.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    Số lượng: {ticket.quantity} x {formatCurrency(ticket.price)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-6 flex justify-end space-x-3">
                            {selectedPayment.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => {
                                            confirmPayment(selectedPayment._id);
                                            setShowModal(false);
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <FaCheckCircle className="inline mr-2" />
                                        Xác nhận thanh toán
                                    </button>
                                    <button
                                        onClick={() => {
                                            cancelPayment(selectedPayment._id);
                                            setShowModal(false);
                                        }}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <FaTimesCircle className="inline mr-2" />
                                        Hủy thanh toán
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSConfirmation; 