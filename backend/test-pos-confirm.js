const axios = require('axios');

// Script demo xác nhận thanh toán POS
async function testPOSConfirm() {
    try {
        console.log('🏪 Demo POS Payment Confirmation');
        console.log('================================');
        
        // Thông tin mẫu - thay đổi pos_TxnRef theo mã thực tế
        const confirmData = {
            pos_TxnRef: 'POS_685a823a6d4c4d54549090f4_1750762568733_7hfxvu1uu', // Thay đổi mã này
            transactionId: 'POS_DEMO_' + Date.now(), // Mã giao dịch của máy POS
            status: 'success' // 'success' hoặc 'failed'
        };
        
        console.log('📋 Thông tin xác nhận:');
        console.log('- Mã giao dịch:', confirmData.pos_TxnRef);
        console.log('- Mã POS:', confirmData.transactionId);
        console.log('- Trạng thái:', confirmData.status);
        console.log('');
        
        // Gọi API xác nhận
        const paymentId = '...'; // Thêm ID của payment cần xác nhận
        const response = await axios.put(`http://localhost:5001/api/payments/pos/${paymentId}/confirm`, {}, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_TOKEN_HERE' // Thêm token xác thực
            }
        });
        
        if (response.data.success) {
            console.log('✅ Xác nhận thanh toán thành công!');
            console.log('📄 Chi tiết:');
            console.log('- Message:', response.data.message);
            console.log('- Payment ID:', response.data.payment._id);
            console.log('- Status:', response.data.payment.status);
            console.log('- Tickets Created:', response.data.payment.ticketsCreated?.length || 0);
        } else {
            console.log('❌ Xác nhận thất bại:', response.data.message);
        }
        
    } catch (error) {
        console.error('🚨 Lỗi:', error.response?.data?.message || error.message);
    }
}

// Chạy demo
testPOSConfirm();