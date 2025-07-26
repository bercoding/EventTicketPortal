const express = require('express');
const router = express.Router();
const {
    getCurrentUserProfile,
    updateUserProfile,
    updateUserAvatar,
    changePassword,
    submitOwnerRequest,
    getOwnerRequestStatus,
    verifyIdCardController,
    saveIdVerification
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/uploadMiddleware');

// User profile routes
router.get('/profile/me', protect, getCurrentUserProfile);
router.put('/profile/me', protect, updateUserProfile);
router.put('/profile/me/avatar', protect, uploadAvatar.single('avatar'), updateUserAvatar);
router.put('/profile/me/change-password', protect, changePassword);

// Owner request routes
router.post('/request-owner', protect, submitOwnerRequest);
router.get('/owner-request/status', protect, getOwnerRequestStatus);

// ID verification route
router.post('/verify-id-card', protect, uploadAvatar.fields([
    { name: 'frontIdImage', maxCount: 1 },
    { name: 'backIdImage', maxCount: 1 }
]), verifyIdCardController);

// Thêm route để lưu kết quả xác thực CCCD từ VNPT eKYC SDK Web
router.post('/save-id-verification', protect, saveIdVerification);

module.exports = router; 