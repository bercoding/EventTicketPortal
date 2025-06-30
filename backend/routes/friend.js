const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');

router.post('/add', friendController.addFriend);
router.post('/unfriend', friendController.unfriend);
router.post('/block-friend', friendController.blockFriend);
router.post('/unblock-friend', friendController.unblockFriend);
router.get('/friends/:userId', friendController.getFriends);
router.get('/friend-requests/:userId', friendController.getFriendRequests);
router.post('/accept-friend-request', friendController.acceptFriendRequest);
router.post('/reject-friend-request', friendController.rejectFriendRequest);

module.exports = router;
