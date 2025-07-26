import api from './api';

/**
 * Gửi yêu cầu hoàn tiền mới
 * @param {Object} data - Dữ liệu yêu cầu hoàn tiền
 * @param {string} data.bookingId - ID đơn hàng cần hoàn tiền
 * @param {string} data.reason - Lý do hoàn tiền
 * @param {Object} data.bankInfo - Thông tin ngân hàng
 * @returns {Promise} Kết quả yêu cầu
 */
const createRefundRequest = (data) => {
    return api.post('/refunds/requests', data);
};

/**
 * Lấy danh sách yêu cầu hoàn tiền của người dùng
 * @returns {Promise} Danh sách yêu cầu hoàn tiền
 */
const getUserRefundRequests = () => {
    return api.get('/refunds/user-requests');
};

export const refundService = {
    createRefundRequest,
    getUserRefundRequests
}; 