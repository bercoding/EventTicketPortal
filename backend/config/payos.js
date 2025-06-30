const PayOS = require('@payos/node');

// PayOS Configuration
const payOSConfig = {
    PAYOS_CLIENT_ID: process.env.PAYOS_CLIENT_ID || 'your_client_id',
    PAYOS_API_KEY: process.env.PAYOS_API_KEY || 'your_api_key', 
    PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY || 'your_checksum_key'
};

console.log('PayOS config:', {
    client_id: payOSConfig.PAYOS_CLIENT_ID ? 'Set' : 'Not set',
    api_key: payOSConfig.PAYOS_API_KEY ? 'Set' : 'Not set',
    checksum_key: payOSConfig.PAYOS_CHECKSUM_KEY ? 'Set' : 'Not set'
});

// Initialize PayOS
const payOS = new PayOS(
    payOSConfig.PAYOS_CLIENT_ID,
    payOSConfig.PAYOS_API_KEY,
    payOSConfig.PAYOS_CHECKSUM_KEY
);

module.exports = {
    payOS,
    payOSConfig
}; 