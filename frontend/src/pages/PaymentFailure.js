import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const PaymentFailure = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [paymentInfo, setPaymentInfo] = useState({
        pos_TxnRef: searchParams.get('pos_TxnRef') || location.state?.pos_TxnRef || '',
        amount: searchParams.get('amount') || location.state?.totalAmount || '',
        orderInfo: searchParams.get('orderInfo') || 'Thanh toán vé sự kiện',
        errorCode: searchParams.get('errorCode') || '',
        transDate: new Date().toLocaleString('vi-VN')
    });

    useEffect(() => {
        // Show error toast
        toast.error('Thanh toán POS thất bại!');
        
        // Auto redirect after 15 seconds
        const timer = setTimeout(() => {
            navigate('/events');
        }, 15000);

        return () => clearTimeout(timer);
    }, [navigate]);

    const formatAmount = (amount) => {
        const numAmount = parseInt(amount) || 0;
        return numAmount.toLocaleString('vi-VN');
    };

    const getErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'INSUFFICIENT_FUNDS':
                return 'Số dư không đủ để thực hiện giao dịch';
            case 'CARD_DECLINED':
                return 'Thẻ bị từ chối, vui lòng kiểm tra lại';
            case 'INVALID_CARD':
                return 'Thẻ không hợp lệ';
            case 'NETWORK_ERROR':
                return 'Lỗi kết nối mạng';
            default:
                return 'Giao dịch thất bại, vui lòng thử lại';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md w-full">
                {/* Error Icon */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                    <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Thanh toán thất bại
                </h2>

                {/* Error Message */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-800 text-sm font-medium mb-2">
                        {getErrorMessage(paymentInfo.errorCode)}
                    </p>
                    {paymentInfo.errorCode && (
                        <p className="text-red-600 text-xs">
                            Mã lỗi: {paymentInfo.errorCode}
                        </p>
                    )}
                </div>

                {/* Payment Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-semibold text-gray-900 mb-3">Chi tiết giao dịch</h3>
                    
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Mã giao dịch:</span>
                            <span className="font-medium">{paymentInfo.pos_TxnRef}</span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-gray-600">Số tiền:</span>
                            <span className="font-medium">
                                {formatAmount(paymentInfo.amount)} VNĐ
                            </span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-gray-600">Phương thức:</span>
                            <span className="font-medium">Thanh toán POS</span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-gray-600">Thời gian:</span>
                            <span className="font-medium">{paymentInfo.transDate}</span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-gray-600">Trạng thái:</span>
                            <span className="font-medium text-red-600">Thất bại</span>
                        </div>
                    </div>
                </div>

                {/* Support Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800 text-sm">
                        💡 Nếu cần hỗ trợ, vui lòng liên hệ với nhân viên tại quầy POS hoặc gọi hotline.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-3">
                    <button 
                        onClick={() => navigate(-1)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Thử lại thanh toán
                    </button>
                    
                    <Link 
                        to="/events"
                        className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                        Về trang sự kiện
                    </Link>
                </div>

                {/* Auto redirect notice */}
                <p className="text-xs text-gray-500 mt-4">
                    Tự động chuyển về trang sự kiện sau 15 giây...
                </p>
            </div>
        </div>
    );
};

export default PaymentFailure; 