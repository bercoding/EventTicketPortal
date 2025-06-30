const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID || 'your_google_client_id_here'
);
 
module.exports = { client }; 