const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');

router.post('/add', friendController.addFriend);
router.post('/unfriend', friendController.unfriend);
router.post('/block-friend', friendController.blockFriend);
router.post('/unblock-friend', friendController.unblockFriend);
router.get('/friends-list', friendController.getFriendsList);
router.get('/sent-requests/:userId', friendController.getSentRequests);
router.post('/cancel-request', friendController.cancelFriendRequest);
router.get('/search/:userId', friendController.searchFriends);
router.get('/counts/:userId', friendController.getFriendCounts);

module.exports = router;
