/**
 * Chuẩn hóa chuỗi thông tin đơn hàng
 * @param {string} str Chuỗi cần chuẩn hóa
 * @returns {string} Chuỗi đã được chuẩn hóa
 */
function sanitizeOrderInfo(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9 \-_]/g, '');
}

module.exports = {
    sanitizeOrderInfo
}; 