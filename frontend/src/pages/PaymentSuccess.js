import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [paymentInfo, setPaymentInfo] = useState({
        pos_TxnRef: searchParams.get('pos_TxnRef') || location.state?.pos_TxnRef || '',
        amount: searchParams.get('amount') || location.state?.totalAmount || '',
        orderInfo: searchParams.get('orderInfo') || 'Thanh toán vé sự kiện',
        transDate: new Date().toLocaleString('vi-VN')
    });

    useEffect(() => {
        // Show success toast
        toast.success('Thanh toán POS thành công!');
        
        // Auto redirect after 10 seconds
        const timer = setTimeout(() => {
            navigate('/my-tickets');
        }, 10000);

        return () => clearTimeout(timer);
    }, [navigate]);

    const formatAmount = (amount) => {
        const numAmount = parseInt(amount) || 0;
        return numAmount.toLocaleString('vi-VN');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md w-full">
                {/* Success Icon */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Thanh toán thành công!
                </h2>

                {/* Payment Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-semibold text-gray-900 mb-3">Chi tiết thanh toán</h3>
                    
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Mã giao dịch:</span>
                            <span className="font-medium">{paymentInfo.pos_TxnRef}</span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-gray-600">Số tiền:</span>
                            <span className="font-medium text-green-600">
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
                            <span className="font-medium text-green-600">Thành công</span>
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-green-800 text-sm">
                        🎫 Vé đã được cấp thành công và gửi vào tài khoản của bạn.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-3">
                    <Link 
                        to="/my-tickets"
                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                        Xem vé của tôi
                    </Link>
                    
                    <Link 
                        to="/events"
                        className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                        Về trang sự kiện
                    </Link>
                </div>

                {/* Auto redirect notice */}
                <p className="text-xs text-gray-500 mt-4">
                    Tự động chuyển về trang vé của tôi sau 10 giây...
                </p>
            </div>
        </div>
    );
};

export default PaymentSuccess; 