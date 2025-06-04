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
    const response = await axios.get('https://provinces.open-api.vn/api/p/', { timeout: 5000 });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching provinces:', error.message);
    if (error.code === 'ENOTFOUND') {
      // Mock data if API is unavailable
      const mockData = [
        { code: '01', name: 'Hà Nội' },
        { code: '02', name: 'Hồ Chí Minh' }
      ];
      res.status(200).json(mockData);
    } else {
      res.status(503).json({ success: false, error: 'Không thể kết nối tới API provinces. Vui lòng thử lại sau.' });
    }
  }
});

// Get districts by province code
const getDistricts = asyncHandler(async (req, res) => {
  const { provinceCode } = req.params;
  try {
    const response = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`, { timeout: 5000 });
    res.status(200).json(response.data.districts);
  } catch (error) {
    console.error('Error fetching districts:', error.message);
    if (error.code === 'ENOTFOUND') {
      // Mock data if API is unavailable
      const mockData = [
        { code: '001', name: 'Quận 1' },
        { code: '002', name: 'Quận 2' }
      ];
      res.status(200).json(mockData);
    } else {
      res.status(503).json({ success: false, error: 'Không thể kết nối tới API districts. Vui lòng thử lại sau.' });
    }
  }
});

// Get wards by district code
const getWards = asyncHandler(async (req, res) => {
  const { districtCode } = req.params;
  try {
    const response = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`, { timeout: 5000 });
    res.status(200).json(response.data.wards);
  } catch (error) {
    console.error('Error fetching wards:', error.message);
    if (error.code === 'ENOTFOUND') {
      // Mock data if API is unavailable
      const mockData = [
        { code: '00001', name: 'Phường 1' },
        { code: '00002', name: 'Phường 2' }
      ];
      res.status(200).json(mockData);
    } else {
      res.status(503).json({ success: false, error: 'Không thể kết nối tới API wards. Vui lòng thử lại sau.' });
    }
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