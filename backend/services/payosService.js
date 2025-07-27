const { payOS } = require('../config/payos');

class PayOSService {
    constructor() {
        this.payOS = payOS;
        this.frontendUrl = process.env.FRONTEND_URL || 'https://eventfrontend-htfdfzdhh4ftemaz.eastus-01.azurewebsites.net';
    }

    /**
     * Tạo link thanh toán PayOS
     * @param {Object} paymentData - Thông tin thanh toán
     * @returns {Object} Payment URL và thông tin
     */
    async createPaymentLink(paymentData) {
        try {
            const { orderCode, amount, description, items = [], buyerInfo = {} } = paymentData;

            console.log('💰 Creating PayOS payment with data:', {
                orderCode,
                amount,
                description,
                itemsCount: items.length
            });

            // Giới hạn mô tả đơn hàng không quá 25 ký tự
            const shortDescription = description && description.length > 25 
                ? description.substring(0, 22) + '...' 
                : description || 'Thanh toán';

            // Chuẩn bị dữ liệu đơn hàng
            const orderData = {
                orderCode: Number(orderCode), // Đảm bảo orderCode là số
                amount: Number(amount), // Đảm bảo amount là số
                description: shortDescription, // Mô tả đơn hàng đã giới hạn độ dài
                items: items.length > 0 ? items.map(item => ({
                    name: item.name && item.name.length > 25 ? item.name.substring(0, 22) + '...' : item.name,
                    quantity: Number(item.quantity) || 1,
                    price: Number(item.price) || 0
                })) : [
                    {
                        name: shortDescription,
                        quantity: 1,
                        price: Number(amount)
                    }
                ],
                returnUrl: `${this.frontendUrl}/payment/payos-return`,
                cancelUrl: `${this.frontendUrl}/payment/payos-cancel`
            };

            // Thêm thông tin buyer nếu có
            if (buyerInfo.name || buyerInfo.email || buyerInfo.phone) {
                orderData.buyerInfo = {
                    buyerName: buyerInfo.name || '',
                    buyerEmail: buyerInfo.email || '',
                    buyerPhone: buyerInfo.phone || ''
                };
            }

            console.log('📦 PayOS order data:', JSON.stringify(orderData, null, 2));
            console.log('🔑 PayOS API Key status:', this.payOS ? 'Initialized' : 'Not initialized');

            // Tạo payment link
            try {
                console.log('🚀 Calling PayOS.createPaymentLink...');
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('PayOS API timeout after 10 seconds')), 10000)
                );
                const paymentLinkResponse = await Promise.race([
                    this.payOS.createPaymentLink(orderData),
                    timeoutPromise
                ]);
                
                console.log('✅ PayOS payment link created:', {
                    checkoutUrl: paymentLinkResponse.checkoutUrl,
                    paymentLinkId: paymentLinkResponse.paymentLinkId
                });

                return {
                    success: true,
                    checkoutUrl: paymentLinkResponse.checkoutUrl,
                    paymentLinkId: paymentLinkResponse.paymentLinkId,
                    orderCode: orderCode,
                    qrCode: paymentLinkResponse.qrCode,
                    amount: amount,
                    description: shortDescription
                };
            } catch (apiError) {
                console.error('❌ PayOS API Error:', apiError.message);
                console.error('❌ PayOS API Error stack:', apiError.stack);
                if (apiError.response) {
                    console.error('Response status:', apiError.response.status);
                    console.error('Response data:', JSON.stringify(apiError.response.data, null, 2));
                }
                throw apiError;
            }

        } catch (error) {
            console.error('❌ PayOS payment creation failed:', error);
            return {
                success: false,
                error: error.message || 'PayOS service error',
                details: error.toString()
            };
        }
    }

    /**
     * Lấy thông tin đơn hàng từ PayOS
     * @param {number} orderCode - Mã đơn hàng
     * @returns {Object} Thông tin đơn hàng
     */
    async getPaymentLinkInformation(orderCode) {
        try {
            console.log('🔍 Getting PayOS payment info for order:', orderCode);

            const paymentInfo = await this.payOS.getPaymentLinkInformation(orderCode);

            console.log('📋 PayOS payment info:', {
                id: paymentInfo.id,
                orderCode: paymentInfo.orderCode,
                status: paymentInfo.status,
                amount: paymentInfo.amount
            });

            return {
                success: true,
                paymentInfo: paymentInfo
            };

        } catch (error) {
            console.error('❌ PayOS get payment info failed:', error);
            return {
                success: false,
                error: error.message || 'Failed to get payment info'
            };
        }
    }

    /**
     * Hủy link thanh toán PayOS
     * @param {number} orderCode - Mã đơn hàng
     * @returns {Object} Kết quả hủy
     */
    async cancelPaymentLink(orderCode, cancellationReason = 'User cancelled') {
        try {
            console.log('❌ Cancelling PayOS payment for order:', orderCode);

            const cancelResponse = await this.payOS.cancelPaymentLink(orderCode, cancellationReason);

            console.log('✅ PayOS payment cancelled:', cancelResponse);

            return {
                success: true,
                cancelResponse: cancelResponse
            };

        } catch (error) {
            console.error('❌ PayOS cancel payment failed:', error);
            return {
                success: false,
                error: error.message || 'Failed to cancel payment'
            };
        }
    }

    /**
     * Xác thực webhook từ PayOS
     * @param {Object} webhookData - Dữ liệu webhook
     * @returns {boolean} Kết quả xác thực
     */
    verifyPaymentWebhookData(webhookData) {
        try {
            return this.payOS.verifyPaymentWebhookData(webhookData);
        } catch (error) {
            console.error('❌ PayOS webhook verification failed:', error);
            return false;
        }
    }

    /**
     * Tạo mã đơn hàng unique
     * @param {string} prefix - Prefix cho mã đơn hàng
     * @returns {number} Mã đơn hàng
     */
    generateOrderCode(prefix = 'POS') {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return parseInt(`${timestamp}${random}`);
    }

    /**
     * Format thông tin items cho PayOS
     * @param {Array} selectedTickets - Danh sách vé đã chọn
     * @param {Array} selectedSeats - Danh sách ghế đã chọn
     * @returns {Array} Danh sách items
     */
    formatOrderItems(selectedTickets = [], selectedSeats = []) {
        const items = [];

        // Xử lý vé đơn giản
        selectedTickets.forEach(ticket => {
            items.push({
                name: ticket.name || ticket.ticketTypeName || 'Event Ticket',
                quantity: ticket.quantity || 1,
                price: ticket.price || 0
            });
        });

        // Xử lý ghế
        selectedSeats.forEach(seat => {
            items.push({
                name: `${seat.ticketType || 'Seat'} - ${seat.sectionName || 'Section'} ${seat.seatNumber || ''}`,
                quantity: 1,
                price: seat.price || 0
            });
        });

        return items;
    }
}

module.exports = PayOSService; 