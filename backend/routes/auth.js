// backend/routes/auth.js
const express = require('express');
const {
    register,
    verifyOTP,
    resendOTP,
    login,
    getMe,
    forgotPassword,
    verifyResetOTP,
    resetPasswordWithOTP,
    resetPassword
} = require('../controllers/authController');
const { googleAuth } = require('../controllers/googleAuthController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password-with-otp', resetPasswordWithOTP);
router.post('/reset-password', resetPassword);

module.exports = router;