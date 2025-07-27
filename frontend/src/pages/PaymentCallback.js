import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import './PaymentCallback.css';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const PaymentCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [paymentResult, setPaymentResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();
    const { user } = useAuth();

    // Log socket và user state khi component mount
    useEffect(() => {
        console.log('🔄 Component mounted. Socket state:', {
            isConnected: socket?.connected,
            socketId: socket?.id
        });
        console.log('👤 User state:', user);
        
        // Kiểm tra nếu có tham số payment_success=true thì chuyển hướng về trang vé của tôi
        const paymentSuccess = searchParams.get('payment_success');
        const orderCode = searchParams.get('orderCode');
        
        if (paymentSuccess === 'true') {
            console.log('🎫 Payment success detected in URL params. Order code:', orderCode);
            toast.success('Thanh toán thành công! Đang chuyển hướng đến vé của bạn...');
            
            // Thêm timeout để đảm bảo toast message hiển thị
            setTimeout(() => {
                navigate('/my-tickets', { 
                    state: { highlightNewTickets: true, paymentSuccess: true, orderCode },
                    replace: true
                });
            }, 1500);
            return;
        }
        
        // Tiếp tục xử lý các trường hợp khác
        handlePaymentCallback();
    }, [searchParams, navigate, user]);

    // Xử lý socket connection và authentication
    useEffect(() => {
        if (socket && user) {
            console.log('🔌 Setting up socket connection...');
            
            // Đăng ký các event listeners
            socket.on('connect', () => {
                console.log('✅ Socket connected:', socket.id);
                // Authenticate socket connection
                socket.emit('authenticate', user._id);
            });

            socket.on('disconnect', () => {
                console.log('❌ Socket disconnected');
            });

            // Lắng nghe sự kiện payment_success
            socket.on('payment_success', (data) => {
                console.log('💰 Received payment success notification:', data);
                toast.success(data.message);
                
                console.log('🔄 Redirecting to my-tickets page...');
                // Thêm timeout để đảm bảo toast message hiển thị
                setTimeout(() => {
                    navigate('/my-tickets', { 
                        state: { highlightNewTickets: true },
                        replace: true
                    });
                }, 1500);
            });

            return () => {
                console.log('🧹 Cleaning up socket listeners...');
                socket.off('connect');
                socket.off('disconnect');
                socket.off('payment_success');
            };
        } else {
            console.log('⚠️ Socket or user not available:', {
                socketAvailable: !!socket,
                userAvailable: !!user
            });
        }
    }, [socket, user, navigate]);

    // Thêm hàm kiểm tra trạng thái thanh toán
    const checkPaymentStatus = async (txnRef) => {
        try {
            console.log('Checking payment status for:', txnRef);
            const response = await fetch(`/api/payment/status/${txnRef}`);
            const data = await response.json();
            console.log('Payment status response:', data);
            
            if (data.status === 'paid') {
                console.log('Payment is paid, redirecting to my-tickets...');
                // Thêm timeout ngắn để đảm bảo state được cập nhật
                setTimeout(() => {
                    navigate('/my-tickets', { 
                        state: { highlightNewTickets: true },
                        replace: true // Thêm replace để tránh quay lại trang callback
                    });
                }, 100);
            }
            return data.status;
        } catch (error) {
            console.error('Error checking payment status:', error);
            return null;
        }
    };

    // Thêm interval để kiểm tra trạng thái
    useEffect(() => {
        const vnp_TxnRef = searchParams.get('vnp_TxnRef') || searchParams.get('pos_TxnRef');
        console.log('Transaction reference:', vnp_TxnRef);
        
        if (vnp_TxnRef) {
            const interval = setInterval(async () => {
                const status = await checkPaymentStatus(vnp_TxnRef);
                console.log('Current payment status:', status);
                if (status === 'paid') {
                    console.log('Clearing interval, payment is paid');
                    clearInterval(interval);
                }
            }, 5000);

            // Kiểm tra ngay lập tức khi component mount
            checkPaymentStatus(vnp_TxnRef);

            return () => {
                console.log('Cleaning up interval');
                clearInterval(interval);
            };
        }
    }, [searchParams, navigate]); // Thêm navigate vào dependencies

    useEffect(() => {
        handlePaymentCallback();
    }, [searchParams]);

    const handlePaymentCallback = async () => {
        try {
            setLoading(true);
            
            // Get all query parameters from URL
            const vnp_TxnRef = searchParams.get('vnp_TxnRef');
            const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
            const amount = searchParams.get('amount');
            const reason = searchParams.get('reason');
            const error = searchParams.get('error');
            const message = searchParams.get('message');

            // Determine if payment was successful based on URL path or parameters
            const isSuccess = vnp_ResponseCode === '00' || window.location.pathname.includes('/success');
            
            setPaymentResult({
                success: isSuccess,
                payment: {
                    vnp_TxnRef: vnp_TxnRef,
                    totalAmount: amount ? parseInt(amount) : null,
                    paymentDate: new Date(),
                    status: isSuccess ? 'success' : 'failed',
                    vnp_ResponseCode: vnp_ResponseCode,
                    errorReason: reason,
                    errorMessage: message
                }
            });

        } catch (error) {
            console.error('Payment callback error:', error);
            setPaymentResult({
                success: false,
                payment: {
                    status: 'failed',
                    errorMessage: 'Có lỗi xảy ra khi xử lý kết quả thanh toán'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = () => {
        if (paymentResult?.success) {
            return '✅';
        }
        return '❌';
    };

    const getStatusMessage = () => {
        if (paymentResult?.success) {
            return 'Thanh toán thành công!';
        }
        return 'Thanh toán thất bại!';
    };

    const getStatusClass = () => {
        if (paymentResult?.success) {
            return 'payment-success';
        }
        return 'payment-failed';
    };

    const formatCurrency = (amount) => {
        if (!amount) return '';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="payment-callback-container">
                <div className="payment-callback-card">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                    <h2>Đang xử lý kết quả thanh toán...</h2>
                    <p>Vui lòng đợi trong giây lát</p>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-callback-container">
            <div className={`payment-callback-card ${getStatusClass()}`}>
                <div className="status-icon">
                    {getStatusIcon()}
                </div>
                
                <h2>{getStatusMessage()}</h2>
                
                {paymentResult?.payment && (
                    <div className="payment-details">
                        {paymentResult.payment.vnp_TxnRef && (
                            <div className="detail-row">
                                <span className="label">Mã giao dịch:</span>
                                <span className="value">{paymentResult.payment.vnp_TxnRef}</span>
                            </div>
                        )}
                        
                        {paymentResult.payment.totalAmount && (
                            <div className="detail-row">
                                <span className="label">Số tiền:</span>
                                <span className="value">
                                    {formatCurrency(paymentResult.payment.totalAmount)}
                                </span>
                            </div>
                        )}
                        
                        <div className="detail-row">
                            <span className="label">Thời gian:</span>
                            <span className="value">
                                {new Date().toLocaleString('vi-VN')}
                            </span>
                        </div>
                        
                        <div className="detail-row">
                            <span className="label">Trạng thái:</span>
                            <span className={`value status-${paymentResult.payment.status}`}>
                                {paymentResult.payment.status === 'success' ? 'Thành công' : 'Thất bại'}
                            </span>
                        </div>

                        {paymentResult.payment.errorMessage && (
                            <div className="detail-row">
                                <span className="label">Lý do:</span>
                                <span className="value error">{paymentResult.payment.errorMessage}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="result-message">
                    {paymentResult?.success ? (
                        <div className="success-message">
                            <p>🎉 Chúc mừng! Bạn đã đặt vé thành công.</p>
                            <p>Vé của bạn đã được gửi vào email và có thể xem trong mục "Vé của tôi".</p>
                        </div>
                    ) : (
                        <div className="failed-message">
                            <p>😔 Rất tiếc! Giao dịch không thành công.</p>
                            <p>Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.</p>
                            {paymentResult?.payment?.vnp_ResponseCode && (
                                <p className="error-code">Mã lỗi: {paymentResult.payment.vnp_ResponseCode}</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="callback-actions">
                    {paymentResult?.success ? (
                        <>
                            <Link to="/my-tickets" className="btn btn-primary">
                                Xem vé của tôi
                            </Link>
                            <Link to="/" className="btn btn-secondary">
                                Về trang chủ
                            </Link>
                        </>
                    ) : (
                        <>
                            <button 
                                className="btn btn-primary"
                                onClick={() => navigate(-2)} // Go back to event page
                            >
                                Thử lại
                            </button>
                            <Link to="/" className="btn btn-secondary">
                                Về trang chủ
                            </Link>
                        </>
                    )}
                </div>

                <div className="support-info">
                    <p>Cần hỗ trợ? Liên hệ:</p>
                    <p>📧 support@eventticket.com | 📞 1900-1234</p>
                </div>
            </div>
        </div>
    );
};

export default PaymentCallback; 