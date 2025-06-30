const axios = require('axios');

// Script demo VietQR + PayOS integration
async function testVietQRPayOSDemo() {
    try {
        console.log('🎯 Demo VietQR + PayOS Integration Test');
        console.log('=====================================');
        
        // Step 1: Login to get token
        console.log('🔐 Step 1: Login to get authentication token...');
        const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'thanhnhanqb08@gmail.com',
            password: 'newpassword123'
        });
        
        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful, token obtained');
        
        // Step 2: Create enhanced POS payment with VietQR and PayOS
        console.log('\\n🚀 Step 2: Create POS payment with VietQR + PayOS...');
        
        const paymentData = {
            eventId: '685a83b06d4c4d5454909197', // Test Event for Booking ID 
            selectedTickets: [
                {
                    ticketTypeId: '685a83b06d4c4d5454909198',
                    name: 'Vé thường',
                    price: 100000,
                    quantity: 1
                }
            ],
            totalAmount: 100000,
            bookingType: 'simple'
        };
        
        console.log('📋 Payment request data:', paymentData);
        
        const paymentResponse = await axios.post(
            'http://localhost:5001/api/payments/create-pos-payment',
            paymentData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!paymentResponse.data.success) {
            throw new Error(`Payment creation failed: ${paymentResponse.data.message}`);
        }
        
        const result = paymentResponse.data;
        console.log('\\n🎉 Enhanced POS Payment Created Successfully!');
        console.log('==============================================');
        console.log('📊 Payment Summary:');
        console.log(`   💳 Payment ID: ${result.paymentId}`);
        console.log(`   🏪 POS Transaction: ${result.pos_TxnRef}`);
        console.log(`   💰 Total Amount: ${result.totalAmount.toLocaleString()} VNĐ`);
        
        console.log('\\n🏦 VietQR Banking Option:');
        if (result.vietqr) {
            console.log('   ✅ VietQR Generated Successfully');
            console.log(`   🏦 Bank: ${result.vietqr.bankInfo?.bankName || 'MB Bank'}`);
            console.log(`   📱 Account: ${result.vietqr.bankInfo?.accountNo || 'Hidden'}`);
            console.log(`   📄 QR Data: ${result.vietqr.qrDataURL ? 'Generated' : 'Failed'}`);
            console.log(`   🔄 Fallback Mode: ${result.vietqr.isFallback ? 'Yes' : 'No'}`);
        } else {
            console.log('   ❌ VietQR Generation Failed');
        }
        
        console.log('\\n💳 PayOS Gateway Option:');
        if (result.payos) {
            console.log('   ✅ PayOS Link Generated Successfully');
            console.log(`   🔗 Checkout URL: ${result.payos.checkoutUrl}`);
            console.log(`   🎫 Order Code: ${result.payos.orderCode}`);
            console.log(`   📱 QR Available: ${result.payos.qrCode ? 'Yes' : 'No'}`);
        } else {
            console.log('   ❌ PayOS Link Generation Failed');
        }
        
        console.log('\\n🏪 POS Counter Option:');
        console.log('   ✅ POS Reference Generated');
        console.log(`   🎯 Transaction Code: ${result.pos_TxnRef}`);
        console.log('   💰 Available for counter payment');
        
        console.log('\\n📋 Customer Instructions:');
        console.log('==========================================');
        console.log('Khách hàng có thể thanh toán bằng 3 cách:');
        console.log('');
        
        if (result.vietqr) {
            console.log('🏦 CÁCH 1: VietQR Banking');
            console.log('   • Mở app ngân hàng');
            console.log('   • Quét mã QR');
            console.log('   • Xác nhận chuyển khoản');
        }
        
        if (result.payos) {
            console.log('\\n💳 CÁCH 2: PayOS Gateway');
            console.log('   • Truy cập link PayOS');
            console.log('   • Chọn Momo/ZaloPay/Thẻ');
            console.log('   • Hoàn tất thanh toán');
        }
        
        console.log('\\n🏪 CÁCH 3: POS Counter');
        console.log('   • Đến quầy với mã giao dịch');
        console.log('   • Thanh toán bằng tiền mặt/thẻ');
        console.log('   • Nhận vé ngay lập tức');
        
        console.log('\\n🎯 Demo completed successfully!');
        console.log('Tất cả tùy chọn thanh toán đã sẵn sàng cho khách hàng.');
        
        return result;
        
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
        console.error('Error details:', error);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
        if (error.code === 'ECONNREFUSED') {
            console.error('🚨 Server không chạy! Vui lòng start backend server trước.');
        }
        throw error;
    }
}

// Run the demo
if (require.main === module) {
    testVietQRPayOSDemo()
        .then(() => {
            console.log('\\n🏁 Demo hoàn thành thành công!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\\n💥 Demo thất bại:', error.message);
            process.exit(1);
        });
}

module.exports = testVietQRPayOSDemo; 