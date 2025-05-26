const express = require('express');
const router = express.Router();
const {
  createVenue,
  getVenues,
  getVenueById,
  updateVenue,
  deleteVenue,
  getProvinces,
  getDistricts,
  getWards
} = require('../controllers/venueController');
// const { protect } = require('../middleware/auth'); // Nếu có, tạm thời bỏ hoặc áp dụng chọn lọc

// Đặt các routes cụ thể TRƯỚC routes có tham số động
router.get('/provinces', getProvinces); // Không cần protect
router.get('/districts/:provinceCode', getDistricts); // Không cần protect
router.get('/wards/:districtCode', getWards); // Không cần protect

// Routes chung cho venues
router.route('/')
  .post(createVenue) // Có thể thêm protect nếu cần xác thực
  .get(getVenues);  // Có thể thêm protect nếu cần xác thực

// Routes có tham số động đặt CUỐI CÙNG
router.route('/:id')
  .get(getVenueById)  // Có thể thêm protect nếu cần xác thực
  .put(updateVenue)   // Có thể thêm protect nếu cần xác thực
  .delete(deleteVenue); // Có thể thêm protect nếu cần xác thực

module.exports = router;