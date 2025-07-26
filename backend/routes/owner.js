const express = require('express');
const router = express.Router();
const { getOwnerStatistics } = require('../controllers/ownerController');
const { protect } = require('../middleware/auth');

// Middleware xác thực
router.use(protect);

// Lấy thống kê tổng quan cho owner
router.get('/statistics', getOwnerStatistics);

module.exports = router; 