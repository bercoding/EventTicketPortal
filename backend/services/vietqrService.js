const axios = require('axios');
const QRCode = require('qrcode');

class VietQRService {
    constructor() {
        // Thông tin ngân hàng mặc định (có thể config từ env)
        this.bankConfig = {
            accountNo: process.env.BANK_ACCOUNT_NO || '0763140575',
            accountName: process.env.BANK_ACCOUNT_NAME || 'LE THANH NHAN',
            acqId: process.env.BANK_ACQ_ID || '970422', // Mã ngân hàng MB Bank
            template: 'compact'
        };
        
        console.log('VietQR Bank config:', {
            accountNo: this.bankConfig.accountNo,
            accountName: this.bankConfig.accountName,
            acqId: this.bankConfig.acqId
        });
    }

    /**
     * Tạo mã QR VietQR cho thanh toán
     * @param {number} amount - Số tiền
     * @param {string} description - Nội dung chuyển khoản
     * @param {string} addInfo - Thông tin thêm
     * @returns {Object} QR data và URL
     */
    async generateVietQR(amount, description, addInfo = '') {
        try {
            const qrData = {
                accountNo: this.bankConfig.accountNo,
                accountName: this.bankConfig.accountName,
                acqId: this.bankConfig.acqId,
                amount: amount,
                addInfo: addInfo || description,
                format: 'text',
                template: this.bankConfig.template
            };

            console.log('🏦 Generating VietQR with data:', qrData);

            // Gọi API VietQR (public API)
            const response = await axios.post('https://api.vietqr.io/v2/generate', qrData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.data && response.data.code === '00') {
                console.log('✅ VietQR generated successfully');
                
                return {
                    success: true,
                    qrCode: response.data.data.qrCode, // Base64 QR image
                    qrDataURL: response.data.data.qrDataURL, // Data URL QR image
                    bankInfo: {
                        accountNo: this.bankConfig.accountNo,
                        accountName: this.bankConfig.accountName,
                        bankName: this.getBankName(this.bankConfig.acqId)
                    },
                    paymentInfo: {
                        amount: amount,
                        description: description,
                        addInfo: addInfo
                    }
                };
            } else {
                throw new Error(response.data?.desc || 'VietQR API error');
            }

        } catch (error) {
            console.error('❌ VietQR generation failed:', error.message);
            
            // Fallback: Generate simple QR with bank transfer info
            return this.generateFallbackQR(amount, description, addInfo);
        }
    }

    /**
     * Tạo QR code dự phòng khi VietQR API lỗi
     */
    async generateFallbackQR(amount, description, addInfo) {
        try {
            const bankInfo = `Bank: ${this.getBankName(this.bankConfig.acqId)}
Account: ${this.bankConfig.accountNo}
Name: ${this.bankConfig.accountName}
Amount: ${amount.toLocaleString()} VND
Content: ${description}`;

            const qrDataURL = await QRCode.toDataURL(bankInfo);
            
            console.log('📱 Generated fallback QR code');
            
            return {
                success: true,
                qrCode: null,
                qrDataURL: qrDataURL,
                bankInfo: {
                    accountNo: this.bankConfig.accountNo,
                    accountName: this.bankConfig.accountName,
                    bankName: this.getBankName(this.bankConfig.acqId)
                },
                paymentInfo: {
                    amount: amount,
                    description: description,
                    addInfo: addInfo
                },
                isFallback: true
            };
        } catch (error) {
            console.error('❌ Fallback QR generation failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Lấy tên ngân hàng từ mã ACQ ID
     */
    getBankName(acqId) {
        const bankMap = {
            '970422': 'MB Bank (Quân đội)',
            '970415': 'VietinBank',
            '970436': 'Vietcombank',
            '970418': 'BIDV',
            '970405': 'Agribank',
            '970407': 'Techcombank',
            '970432': 'VPBank',
            '970423': 'TPBank',
            '970403': 'Sacombank',
            '970440': 'SeABank'
        };
        
        return bankMap[acqId] || 'Unknown Bank';
    }

    /**
     * Validate QR payment info
     */
    validatePayment(amount, description) {
        if (!amount || amount <= 0) {
            throw new Error('Invalid amount');
        }
        
        if (!description || description.trim().length === 0) {
            throw new Error('Description is required');
        }
        
        if (amount > 50000000) { // 50M VND limit
            throw new Error('Amount exceeds limit');
        }
        
        return true;
    }
}

module.exports = VietQRService; 