const Venue = require('../models/Venue');
const asyncHandler = require('express-async-handler');
const axios = require('axios');

// Create a new venue
const createVenue = asyncHandler(async (req, res) => {
  const { name, address, city, district, ward, country, availableSeats } = req.body;

  // Validation
  if (!name || !address || !city || !district || !ward) {
    res.status(400);
    throw new Error('Vui lòng cung cấp đầy đủ thông tin: name, address, city, district, ward');
  }

  if (availableSeats !== undefined && (!Number.isInteger(availableSeats) || availableSeats < 1)) {
    res.status(400);
    throw new Error('Số ghế khả dụng phải là số nguyên dương');
  }

  const fullAddress = `${address}, ${ward}, ${district}, ${city}, ${country || 'Vietnam'}`;

  const venue = await Venue.create({
    name,
    address,
    city,
    district,
    ward,
    country: country || 'Vietnam',
    fullAddress,
    availableSeats
  });

  res.status(201).json({
    success: true,
    data: venue
  });
});

// Get all venues
const getVenues = asyncHandler(async (req, res) => {
  const venues = await Venue.find();
  res.status(200).json({
    success: true,
    data: venues
  });
});

// Get a single venue by ID
const getVenueById = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) {
    res.status(404);
    throw new Error(`Không tìm thấy địa điểm với ID ${req.params.id}`);
  }
  res.status(200).json({
    success: true,
    data: venue
  });
});

// Update a venue
const updateVenue = asyncHandler(async (req, res) => {
  const { name, address, city, district, ward, country, availableSeats } = req.body;
  const venue = await Venue.findById(req.params.id);

  if (!venue) {
    res.status(404);
    throw new Error(`Không tìm thấy địa điểm với ID ${req.params.id}`);
  }

  // Validation for availableSeats
  if (availableSeats !== undefined && (!Number.isInteger(availableSeats) || availableSeats < 1)) {
    res.status(400);
    throw new Error('Số ghế khả dụng phải là số nguyên dương');
  }

  venue.name = name || venue.name;
  venue.address = address || venue.address;
  venue.city = city || venue.city;
  venue.district = district || venue.district;
  venue.ward = ward || venue.ward;
  venue.country = country || venue.country;
  venue.availableSeats = availableSeats !== undefined ? availableSeats : venue.availableSeats;

  if (address || city || district || ward || country) {
    venue.fullAddress = `${venue.address}, ${venue.ward}, ${venue.district}, ${venue.city}, ${venue.country}`;
  }

  const updatedVenue = await venue.save();

  res.status(200).json({
    success: true,
    data: updatedVenue
  });
});

// Delete a venue
const deleteVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);

  if (!venue) {
    res.status(404);
    throw new Error(`Không tìm thấy địa điểm với ID ${req.params.id}`);
  }

  await venue.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Venue deleted successfully'
  });
});

// Get all provinces
const getProvinces = asyncHandler(async (req, res) => {
  try {
    console.log('🌍 Fetching provinces from external API...');
    const response = await axios.get('https://provinces.open-api.vn/api/p/', { 
      timeout: 10000,
      headers: {
        'User-Agent': 'EventTicketPortal/1.0',
        'Accept': 'application/json'
      }
    });
    console.log('✅ Provinces fetched successfully:', response.data.length, 'provinces');
    res.status(200).json(response.data);
  } catch (error) {
    console.error('❌ Error fetching provinces:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Enhanced fallback data with more provinces
    const fallbackProvinces = [
      { code: 1, name: 'Thành phố Hà Nội', division_type: 'thành phố', codename: 'thanh_pho_ha_noi', phone_code: 24 },
      { code: 79, name: 'Thành phố Hồ Chí Minh', division_type: 'thành phố', codename: 'thanh_pho_ho_chi_minh', phone_code: 28 },
      { code: 48, name: 'Thành phố Đà Nẵng', division_type: 'thành phố', codename: 'thanh_pho_da_nang', phone_code: 236 },
      { code: 31, name: 'Thành phố Hải Phòng', division_type: 'thành phố', codename: 'thanh_pho_hai_phong', phone_code: 225 },
      { code: 92, name: 'Thành phố Cần Thơ', division_type: 'thành phố', codename: 'thanh_pho_can_tho', phone_code: 292 },
      { code: 74, name: 'Tỉnh Bình Dương', division_type: 'tỉnh', codename: 'tinh_binh_duong', phone_code: 274 },
      { code: 75, name: 'Tỉnh Đồng Nai', division_type: 'tỉnh', codename: 'tinh_dong_nai', phone_code: 251 },
      { code: 56, name: 'Tỉnh Khánh Hòa', division_type: 'tỉnh', codename: 'tinh_khanh_hoa', phone_code: 258 },
      { code: 68, name: 'Tỉnh Lâm Đồng', division_type: 'tỉnh', codename: 'tinh_lam_dong', phone_code: 263 },
      { code: 19, name: 'Tỉnh Thái Nguyên', division_type: 'tỉnh', codename: 'tinh_thai_nguyen', phone_code: 208 }
    ];
    
    console.log('🔄 Using fallback provinces data:', fallbackProvinces.length, 'provinces');
    res.status(200).json(fallbackProvinces);
  }
});

// Get districts by province code
const getDistricts = asyncHandler(async (req, res) => {
  const { provinceCode } = req.params;
  try {
    console.log(`🏘️ Fetching districts for province code: ${provinceCode}`);
    const response = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'EventTicketPortal/1.0',
        'Accept': 'application/json'
      }
    });
    console.log('✅ Districts fetched successfully:', response.data.districts?.length || 0, 'districts');
    res.status(200).json(response.data.districts || []);
  } catch (error) {
    console.error('❌ Error fetching districts:', {
      message: error.message,
      code: error.code,
      provinceCode,
      status: error.response?.status
    });
    
    // Enhanced fallback data based on province code
    let fallbackDistricts = [];
    if (provinceCode == 1) { // Hà Nội
      fallbackDistricts = [
        { code: 1, name: 'Quận Ba Đình', division_type: 'quận', codename: 'quan_ba_dinh' },
        { code: 2, name: 'Quận Hoàn Kiếm', division_type: 'quận', codename: 'quan_hoan_kiem' },
        { code: 3, name: 'Quận Tây Hồ', division_type: 'quận', codename: 'quan_tay_ho' },
        { code: 4, name: 'Quận Long Biên', division_type: 'quận', codename: 'quan_long_bien' },
        { code: 5, name: 'Quận Cầu Giấy', division_type: 'quận', codename: 'quan_cau_giay' }
      ];
    } else if (provinceCode == 79) { // TP.HCM
      fallbackDistricts = [
        { code: 760, name: 'Quận 1', division_type: 'quận', codename: 'quan_1' },
        { code: 769, name: 'Quận 2', division_type: 'quận', codename: 'quan_2' },
        { code: 770, name: 'Quận 3', division_type: 'quận', codename: 'quan_3' },
        { code: 771, name: 'Quận 4', division_type: 'quận', codename: 'quan_4' },
        { code: 772, name: 'Quận 5', division_type: 'quận', codename: 'quan_5' }
      ];
    } else if (provinceCode == 48) { // Đà Nẵng
      fallbackDistricts = [
        { code: 490, name: 'Quận Hải Châu', division_type: 'quận', codename: 'quan_hai_chau' },
        { code: 491, name: 'Quận Thanh Khê', division_type: 'quận', codename: 'quan_thanh_khe' },
        { code: 492, name: 'Quận Sơn Trà', division_type: 'quận', codename: 'quan_son_tra' },
        { code: 493, name: 'Quận Ngũ Hành Sơn', division_type: 'quận', codename: 'quan_ngu_hanh_son' }
      ];
    } else {
      fallbackDistricts = [
        { code: 1, name: 'Quận/Huyện 1', division_type: 'quận', codename: 'quan_1' },
        { code: 2, name: 'Quận/Huyện 2', division_type: 'quận', codename: 'quan_2' }
      ];
    }
    
    console.log('🔄 Using fallback districts data:', fallbackDistricts.length, 'districts');
    res.status(200).json(fallbackDistricts);
  }
});

// Get wards by district code
const getWards = asyncHandler(async (req, res) => {
  const { districtCode } = req.params;
  try {
    console.log(`🏠 Fetching wards for district code: ${districtCode}`);
    const response = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'EventTicketPortal/1.0',
        'Accept': 'application/json'
      }
    });
    console.log('✅ Wards fetched successfully:', response.data.wards?.length || 0, 'wards');
    res.status(200).json(response.data.wards || []);
  } catch (error) {
    console.error('❌ Error fetching wards:', {
      message: error.message,
      code: error.code,
      districtCode,
      status: error.response?.status
    });
    
    // Fallback ward data
    const fallbackWards = [
      { code: 1, name: 'Phường 1', division_type: 'phường', codename: 'phuong_1' },
      { code: 2, name: 'Phường 2', division_type: 'phường', codename: 'phuong_2' },
      { code: 3, name: 'Phường 3', division_type: 'phường', codename: 'phuong_3' },
      { code: 4, name: 'Phường 4', division_type: 'phường', codename: 'phuong_4' },
      { code: 5, name: 'Phường 5', division_type: 'phường', codename: 'phuong_5' }
    ];
    
    console.log('🔄 Using fallback wards data:', fallbackWards.length, 'wards');
    res.status(200).json(fallbackWards);
  }
});

module.exports = {
  createVenue,
  getVenues,
  getVenueById,
  updateVenue,
  deleteVenue,
  getProvinces,
  getDistricts,
  getWards
};