const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    register,
    verifyOTP,
    resendOTP,
    login,
    googleAuth,
    forgotPassword,
    verifyResetOTP,
    resetPasswordWithOTP,
    resetPassword,
    getProfile,
    updateProfile,
    changePassword
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password-with-otp', resetPasswordWithOTP);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router; 