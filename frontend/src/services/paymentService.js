import api from './api';

class PaymentService {
    // Tạo thanh toán POS
    async createPOSPayment(paymentData) {
        try {
            const response = await api.post('/payments/create-pos-payment', paymentData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    // Xác nhận thanh toán POS (dành cho admin/POS operator)
    async confirmPOSPayment(paymentId) {
        try {
            const response = await api.put(`/payments/pos/${paymentId}/confirm`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    // Lấy lịch sử thanh toán
    async getPaymentHistory() {
        try {
            const response = await api.get('/payments/history');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    // Lấy phương thức thanh toán
    async getPaymentMethods() {
        try {
            const response = await api.get('/payments/methods');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    // Lấy chi tiết thanh toán
    async getPaymentDetail(paymentId) {
        try {
            const response = await api.get(`/payments/${paymentId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    // Format số tiền VND
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    // Validate dữ liệu thanh toán
    validatePaymentData(paymentData) {
        const { eventId, selectedSeats, selectedTickets, bookingType } = paymentData;
        
        if (!eventId) {
            throw new Error('Vui lòng chọn sự kiện');
        }
        
        if (bookingType === 'simple') {
            // Validate simple booking
            if (!selectedTickets || selectedTickets.length === 0) {
                throw new Error('Vui lòng chọn ít nhất một loại vé');
            }
            
            for (const ticket of selectedTickets) {
                if (!ticket.price || ticket.price <= 0) {
                    throw new Error('Giá vé không hợp lệ');
                }
                if (!ticket.quantity || ticket.quantity <= 0) {
                    throw new Error('Số lượng vé không hợp lệ');
                }
            }
        } else {
            // Validate seat booking
            if (!selectedSeats || selectedSeats.length === 0) {
                throw new Error('Vui lòng chọn ít nhất một ghế');
            }
            
            for (const seat of selectedSeats) {
                if (!seat.price || seat.price <= 0) {
                    throw new Error('Giá vé không hợp lệ');
                }
            }
        }
        
        return true;
    }

    // Tính tổng tiền
    calculateTotal(selectedSeats) {
        return selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0);
    }
}

const paymentService = new PaymentService();
export default paymentService; 