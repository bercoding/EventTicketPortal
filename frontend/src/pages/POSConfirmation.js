import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const POSConfirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const {
        pos_TxnRef,
        totalAmount,
        paymentId,
        eventTitle,
        vietqr,
        payos
    } = location.state || {};

    const [countdown, setCountdown] = useState(10 * 60); // 10 minutes
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('pos');

    useEffect(() => {
        if (!pos_TxnRef) {
            toast.error('Không có thông tin thanh toán');
            navigate('/events');
            return;
        }

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    toast.warning('Hết thời gian thanh toán');
                    navigate('/events');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [pos_TxnRef, navigate]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            toast.success('Đã copy vào clipboard');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handlePayOSPayment = () => {
        if (payos?.checkoutUrl) {
            window.open(payos.checkoutUrl, '_blank');
        } else {
            toast.error('Không có link thanh toán PayOS');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Thanh toán đã sẵn sàng
                    </h2>
                    <p className="text-gray-600">
                        Chọn phương thức thanh toán phù hợp
                    </p>
                </div>

                {/* Countdown Timer */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                        {formatTime(countdown)}
                    </div>
                    <p className="text-sm text-orange-700">
                        Thời gian còn lại để thanh toán
                    </p>
                </div>

                {/* Payment Tabs */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Tab Headers */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex">
                            <button
                                onClick={() => setActiveTab('pos')}
                                className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 ${
                                    activeTab === 'pos'
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                🏪 POS Counter
                            </button>
                            {vietqr && (
                                <button
                                    onClick={() => setActiveTab('vietqr')}
                                    className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 ${
                                        activeTab === 'vietqr'
                                            ? 'border-green-500 text-green-600 bg-green-50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    🏦 VietQR Banking
                                </button>
                            )}
                            {payos && (
                                <button
                                    onClick={() => setActiveTab('payos')}
                                    className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 ${
                                        activeTab === 'payos'
                                            ? 'border-purple-500 text-purple-600 bg-purple-50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    💳 PayOS
                                </button>
                            )}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* POS Counter Tab */}
                        {activeTab === 'pos' && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Thanh toán tại quầy POS
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        Mang mã này đến quầy để thanh toán bằng tiền mặt hoặc thẻ
                                    </p>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-600">Mã giao dịch:</span>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-mono font-medium">{pos_TxnRef}</span>
                                            <button
                                                onClick={() => copyToClipboard(pos_TxnRef)}
                                                className="text-blue-600 hover:text-blue-800 p-1"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-600">Sự kiện:</span>
                                        <span className="font-medium">{eventTitle || 'Sự kiện'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Tổng tiền:</span>
                                        <span className="font-bold text-blue-600 text-lg">
                                            {formatAmount(totalAmount)} VNĐ
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-900 mb-2">Hướng dẫn:</h4>
                                    <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
                                        <li>Đến quầy POS tại địa điểm sự kiện</li>
                                        <li>Cung cấp mã giao dịch cho nhân viên</li>
                                        <li>Thanh toán bằng tiền mặt hoặc quẹt thẻ</li>
                                        <li>Nhận vé điện tử qua email</li>
                                    </ol>
                                </div>
                            </div>
                        )}

                        {/* VietQR Tab */}
                        {activeTab === 'vietqr' && vietqr && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Thanh toán VietQR
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        Quét mã QR bằng app ngân hàng để chuyển khoản
                                    </p>
                                </div>

                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* QR Code */}
                                    <div className="flex-1 text-center">
                                        {vietqr.qrDataURL && (
                                            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                                                <img 
                                                    src={vietqr.qrDataURL} 
                                                    alt="VietQR Code"
                                                    className="w-48 h-48 mx-auto"
                                                />
                                                {vietqr.isFallback && (
                                                    <p className="text-xs text-orange-600 mt-2">
                                                        ⚠️ QR dự phòng - Vui lòng chuyển khoản thủ công
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Bank Info */}
                                    <div className="flex-1">
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                            <h4 className="font-semibold text-gray-900">Thông tin chuyển khoản:</h4>
                                            
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Ngân hàng:</span>
                                                    <span className="font-medium">{vietqr.bankInfo?.bankName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Số tài khoản:</span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-mono">{vietqr.bankInfo?.accountNo}</span>
                                                        <button
                                                            onClick={() => copyToClipboard(vietqr.bankInfo?.accountNo)}
                                                            className="text-blue-600 hover:text-blue-800 p-1"
                                                        >
                                                            📋
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Tên tài khoản:</span>
                                                    <span className="font-medium">{vietqr.bankInfo?.accountName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Số tiền:</span>
                                                    <span className="font-bold text-green-600">
                                                        {formatAmount(totalAmount)} VNĐ
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Nội dung:</span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-mono text-sm">{pos_TxnRef}</span>
                                                        <button
                                                            onClick={() => copyToClipboard(pos_TxnRef)}
                                                            className="text-blue-600 hover:text-blue-800 p-1"
                                                        >
                                                            📋
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                                            <h4 className="font-semibold text-green-900 mb-2">Lưu ý quan trọng:</h4>
                                            <ul className="list-disc list-inside text-green-800 space-y-1 text-sm">
                                                <li>Chuyển khoản đúng số tiền</li>
                                                <li>Nhập đúng nội dung: <strong>{pos_TxnRef}</strong></li>
                                                <li>Vé sẽ được tạo tự động sau khi nhận tiền</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PayOS Tab */}
                        {activeTab === 'payos' && payos && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Thanh toán PayOS
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        Thanh toán online qua ví điện tử và thẻ ngân hàng
                                    </p>
                                </div>

                                <div className="text-center">
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                                        <div className="mb-4">
                                            <span className="text-2xl">💳</span>
                                        </div>
                                        <h4 className="font-semibold text-purple-900 mb-2">PayOS Payment</h4>
                                        <p className="text-purple-800 mb-4">
                                            Hỗ trợ: Momo, ZaloPay, ShopeePay, VietQR, thẻ Visa/Mastercard
                                        </p>
                                        <div className="space-y-2 text-sm text-purple-700">
                                            <div className="flex justify-between">
                                                <span>Mã đơn hàng:</span>
                                                <span className="font-mono">{payos.orderCode}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Số tiền:</span>
                                                <span className="font-bold">{formatAmount(totalAmount)} VNĐ</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handlePayOSPayment}
                                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg"
                                    >
                                        🚀 Thanh toán ngay với PayOS
                                    </button>

                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-6">
                                        <h4 className="font-semibold text-purple-900 mb-2">Hướng dẫn:</h4>
                                        <ol className="list-decimal list-inside text-purple-800 space-y-1 text-sm">
                                            <li>Click "Thanh toán ngay với PayOS"</li>
                                            <li>Chọn phương thức thanh toán (Momo, ZaloPay, etc.)</li>
                                            <li>Hoàn tất thanh toán theo hướng dẫn</li>
                                            <li>Vé sẽ được tạo tự động sau khi thanh toán thành công</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        💡 Bạn có thể sử dụng bất kỳ phương thức thanh toán nào ở trên
                    </p>
                </div>
            </div>
        </div>
    );
};

export default POSConfirmation; 