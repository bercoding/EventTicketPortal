const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');

router.post('/add', friendController.addFriend);
router.post('/unfriend', friendController.unfriend);

module.exports = router;
