const express = require('express');
const router = express.Router();
const { getCurrentUserProfile, updateUserProfile, updateUserAvatar, changePassword, submitOwnerRequest, getOwnerRequestStatus } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/uploadMiddleware');

// All routes here are protected
router.use(protect);

// Profile Routes
router.get('/profile/me', getCurrentUserProfile);
router.put('/profile/me', updateUserProfile);
router.put('/profile/me/avatar', uploadAvatar.single('avatar'), updateUserAvatar);
router.put('/profile/me/change-password', changePassword);

// Owner Request Routes  
router.post('/request-owner', submitOwnerRequest);
router.get('/owner-request/status', getOwnerRequestStatus);

module.exports = router; 