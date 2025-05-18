const express = require('express');
const router = express.Router();

// Thêm các route cho sự kiện ở đây
router.get('/', (req, res) => {
    res.send('Danh sách sự kiện');
});

module.exports = router;
