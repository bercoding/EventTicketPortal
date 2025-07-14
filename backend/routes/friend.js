const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');

// Friend management routes
router.post('/add', friendController.addFriend);
router.post('/unfriend', friendController.unfriend);
router.post('/accept-request', friendController.acceptFriendRequest);
router.post('/reject-request', friendController.rejectFriendRequest);
router.post('/cancel-request', friendController.cancelFriendRequest);

// Block/Unblock routes
router.post('/block', friendController.blockFriend);
router.post('/unblock', friendController.unblockFriend);
router.get('/blocked/:userId', friendController.getBlockedUsers);

// Get lists
router.get('/list/:userId', friendController.getFriendsList);
router.get('/requests/:userId', friendController.getFriendRequests);
router.get('/pending/:userId', friendController.getPendingRequests);
router.get('/recommended/:userId', friendController.getRecommendedFriends);

// Search and profile
router.get('/search/:userId', friendController.searchUsers);
router.get('/profile/:userId/:targetUserId', friendController.getUserProfile);

// Debug routes
router.get('/list-all-users', friendController.listAllUsers);
router.get('/debug-search', friendController.debugSearch);

// Test routes
router.get('/test-user-exists', friendController.testUserExists);

module.exports = router;
