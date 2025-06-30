import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import paymentService from '../services/paymentService';
import './PaymentCheckout.css';

const PaymentCheckout = () => {
    // Component instance tracking
    const componentId = React.useRef(Math.random().toString(36).substr(2, 9));
    console.log(`🏗️ PaymentCheckout component mounted with ID: ${componentId.current}`);
    
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get data from navigation state or localStorage
    let checkoutData = location.state || {};
    
    // Fallback to localStorage if no state
    if (!checkoutData.eventId) {
        try {
            const storedCheckoutState = localStorage.getItem('checkoutState');
            if (storedCheckoutState) {
                checkoutData = JSON.parse(storedCheckoutState);
                console.log('💾 PaymentCheckout: Using data from localStorage:', checkoutData);
            }
        } catch (e) {
            console.error('Failed to parse checkout state from localStorage:', e);
        }
    }
    
    const { 
        eventId, 
        selectedSeats = [], 
        selectedTickets = [], 
        eventTitle = 'Sự kiện',
        bookingType = 'seating',
        totalAmount = 0,
        totalPrice = 0
    } = checkoutData;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [paymentData, setPaymentData] = useState(null);
    const [generating, setGenerating] = useState(false); // Start as false!

    // Calculate total amount for display (moved before useEffect to fix initialization error)
    const calculatedTotal = useMemo(() => {
        // Try different sources for total amount
        if (totalAmount > 0) return totalAmount;
        if (totalPrice > 0) return totalPrice;
        
        if (bookingType === 'seating') {
            return selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
        } else {
            return selectedTickets.reduce((sum, ticket) => sum + ((ticket.price || 0) * (ticket.quantity || 0)), 0);
        }
    }, [totalAmount, totalPrice, selectedSeats, selectedTickets, bookingType]);

    // Auto-generate payment options when component loads
    useEffect(() => {
        let isMounted = true; // Prevent state updates if component unmounted
        let hasRun = false; // Prevent multiple executions
        
        const generatePaymentOptions = async () => {
            // CRITICAL: Prevent multiple executions
            if (hasRun) {
                console.log(`🛑 PaymentCheckout [${componentId.current}] Payment generation already attempted, skipping...`);
                return;
            }
            hasRun = true;
            
            console.log(`💾 PaymentCheckout [${componentId.current}] useEffect - Debug data:`);
            console.log('  eventId:', eventId);
            console.log('  selectedSeats length:', selectedSeats?.length || 0);
            console.log('  selectedTickets length:', selectedTickets?.length || 0);
            console.log('  bookingType:', bookingType);
            console.log('  totalAmount:', totalAmount);
            console.log('  calculatedTotal:', calculatedTotal);
            console.log('  generating:', generating);
            console.log('  paymentData exists:', !!paymentData);
            
            if (!eventId) {
                console.error('❌ PaymentCheckout: No eventId provided');
                toast.error('Không có thông tin đặt vé');
                navigate('/events');
                return;
            }

            // Skip if already have payment data (don't check generating here)
            if (paymentData) {
                console.log('⏭️ Skipping payment generation - already have payment data');
                return;
            }

            // Validate we have seats or tickets
            if (bookingType === 'seating' && (!selectedSeats || selectedSeats.length === 0)) {
                console.error('❌ No seats selected for seating booking');
                toast.error('Vui lòng chọn ghế trước khi thanh toán');
                return;
            }

            if (bookingType === 'simple' && (!selectedTickets || selectedTickets.length === 0)) {
                console.error('❌ No tickets selected for simple booking');
                toast.error('Vui lòng chọn vé trước khi thanh toán');
                return;
            }

            // Auto-generate VietQR and PayOS options
            if (isMounted) setGenerating(true);
            
            try {
                const paymentRequestData = {
                    eventId,
                    selectedSeats: bookingType === 'seating' ? selectedSeats : [],
                    selectedTickets: bookingType === 'simple' ? selectedTickets : [],
                    totalAmount: calculatedTotal,
                    bookingType
                };

                console.log('🚀 Auto-generating payment options with data:', paymentRequestData);

                const response = await paymentService.createPOSPayment(paymentRequestData);

                if (response.success && isMounted) {
                    console.log('✅ Payment options generated:', response);
                    setPaymentData(response);
                    toast.success('Đã tạo các tùy chọn thanh toán!');
                } else if (isMounted) {
                    throw new Error(response.message || 'Không thể tạo tùy chọn thanh toán');
                }

            } catch (error) {
                console.error('❌ Auto-generate payment options error:', error);
                if (isMounted) {
                    setError(error.message || 'Có lỗi xảy ra khi tạo tùy chọn thanh toán');
                    toast.error(error.message || 'Có lỗi xảy ra khi tạo tùy chọn thanh toán');
                }
            } finally {
                if (isMounted) setGenerating(false);
            }
        };

        // Add a small delay to prevent race conditions
        const timeoutId = setTimeout(generatePaymentOptions, 100);
        
        return () => {
            isMounted = false; // Cleanup function
            clearTimeout(timeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]); // Only depend on eventId

    const handleProceedToPayment = () => {
        if (!paymentData) {
            toast.error('Vui lòng đợi tạo tùy chọn thanh toán');
            return;
        }

        console.log('💳 Proceeding to payment with generated data:', paymentData);
        
        // Navigate to POS payment confirmation page with all payment options
        navigate('/payment/pos-confirmation', {
            state: {
                pos_TxnRef: paymentData.pos_TxnRef,
                totalAmount: paymentData.totalAmount,
                paymentId: paymentData.paymentId,
                eventTitle,
                vietqr: paymentData.vietqr,
                payos: paymentData.payos
            }
        });
    };

    if (!eventId) {
        return (
            <div className="payment-checkout-container">
                <div className="loading-message">
                    Đang chuyển hướng...
                </div>
            </div>
        );
    }

    if (generating) {
        return (
            <div className="payment-checkout-container">
                <div className="payment-checkout-card">
                    <div className="payment-header">
                        <h2>Đang tạo tùy chọn thanh toán</h2>
                        <p className="event-title">{eventTitle}</p>
                    </div>
                    <div className="loading-payment-options">
                        <div className="spinner"></div>
                        <p>🏦 Đang tạo mã QR VietQR...</p>
                        <p>💳 Đang tạo link PayOS...</p>
                        <p>🏪 Đang chuẩn bị POS...</p>
                        <br />
                        <p className="loading-note">Vui lòng đợi trong giây lát...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-checkout-container">
            <div className="payment-checkout-card">
                <div className="payment-header">
                    <h2>Thanh toán đặt vé</h2>
                    <p className="event-title">{eventTitle}</p>
                </div>

                <div className="payment-content">
                    {/* Booking Summary */}
                    <div className="booking-summary">
                        <h3>Thông tin đặt vé</h3>
                        
                        {bookingType === 'seating' && selectedSeats.length > 0 && (
                            <div className="seats-summary">
                                <h4>Ghế đã chọn ({selectedSeats.length} ghế)</h4>
                                <div className="seats-list">
                                    {selectedSeats.map((seat, index) => (
                                        <div key={index} className="seat-item">
                                            <span className="seat-info">
                                                {seat.sectionName} - Hàng {seat.rowName} - Ghế {seat.seatNumber}
                                            </span>
                                            <span className="seat-price">
                                                {(seat.price || 0).toLocaleString()} VNĐ
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {bookingType === 'simple' && selectedTickets.length > 0 && (
                            <div className="tickets-summary">
                                <h4>Vé đã chọn</h4>
                                <div className="tickets-list">
                                    {selectedTickets.map((ticket, index) => (
                                        <div key={index} className="ticket-item">
                                            <span className="ticket-info">
                                                {ticket.name} x {ticket.quantity}
                                            </span>
                                            <span className="ticket-price">
                                                {((ticket.price || 0) * (ticket.quantity || 0)).toLocaleString()} VNĐ
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="total-amount">
                            <strong>Tổng tiền: {calculatedTotal.toLocaleString()} VNĐ</strong>
                        </div>
                    </div>

                    {/* Payment Options Available */}
                    {paymentData && (
                        <div className="payment-options-preview">
                            <h4>✅ Tùy chọn thanh toán đã sẵn sàng</h4>
                            <div className="payment-options-grid">
                                <div className="payment-option-preview">
                                    <div className="payment-option-icon">🏪</div>
                                    <div className="payment-option-details">
                                        <h5>POS Counter</h5>
                                        <p>Thanh toán tại quầy</p>
                                        <span className="payment-status ready">✓ Sẵn sàng</span>
                                    </div>
                                </div>
                                
                                {paymentData.vietqr && (
                                    <div className="payment-option-preview">
                                        <div className="payment-option-icon">🏦</div>
                                        <div className="payment-option-details">
                                            <h5>VietQR Banking</h5>
                                            <p>Chuyển khoản QR</p>
                                            <span className="payment-status ready">✓ QR đã tạo</span>
                                        </div>
                                    </div>
                                )}
                                
                                {paymentData.payos && (
                                    <div className="payment-option-preview">
                                        <div className="payment-option-icon">💳</div>
                                        <div className="payment-option-details">
                                            <h5>PayOS Gateway</h5>
                                            <p>Momo, ZaloPay, thẻ</p>
                                            <span className="payment-status ready">✓ Link sẵn sàng</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="error-message">
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Payment Actions */}
                    <div className="payment-actions">
                        <button
                            className="cancel-btn"
                            onClick={() => navigate(-1)}
                            disabled={loading}
                        >
                            Quay lại
                        </button>
                        <button
                            className="pay-btn"
                            onClick={handleProceedToPayment}
                            disabled={!paymentData || 
                                (bookingType === 'simple' && selectedTickets.length === 0) ||
                                (bookingType === 'seating' && selectedSeats.length === 0)}
                        >
                            {!paymentData ? 'Đang tạo tùy chọn...' : 'Tiến hành thanh toán'}
                        </button>
                    </div>

                    {/* Payment Info */}
                    <div className="payment-info">
                        {paymentData ? (
                            <>
                                <p className="payment-note">
                                    🎉 Tất cả tùy chọn thanh toán đã sẵn sàng!
                                </p>
                                <p className="instructions">
                                    💡 Bạn có thể chọn thanh toán bằng: 
                                    {paymentData.vietqr && ' 🏦 VietQR'}
                                    {paymentData.payos && ' 💳 PayOS'}
                                    {' 🏪 POS Counter'}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="payment-note">
                                    ⏳ Đang chuẩn bị các tùy chọn thanh toán...
                                </p>
                                <p className="instructions">
                                    💡 Vui lòng đợi trong giây lát để hệ thống tạo mã QR và link thanh toán
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentCheckout; 