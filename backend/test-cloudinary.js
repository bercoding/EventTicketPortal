const { cloudinary } = require('./config/cloudinary');
require('dotenv').config();

console.log('Testing Cloudinary configuration...');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set');

// Test connection
cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary connection successful:', result);
  })
  .catch(error => {
    console.error('❌ Cloudinary connection failed:', error);
  }); 