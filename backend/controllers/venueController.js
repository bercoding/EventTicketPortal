const Venue = require('../models/Venue');
const asyncHandler = require('express-async-handler');
const axios = require('axios');

// Create a new venue
const createVenue = asyncHandler(async (req, res) => {
  const { name, address, city, district, ward, country, availableSeats } = req.body;

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
    throw new Error('Venue not found');
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
    throw new Error('Venue not found');
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
    throw new Error('Venue not found');
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
    const response = await axios.get('https://provinces.open-api.vn/api/p/');
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get districts by province code
const getDistricts = asyncHandler(async (req, res) => {
  const { provinceCode } = req.params;
  try {
    const response = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
    res.status(200).json(response.data.districts);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get wards by district code
const getWards = asyncHandler(async (req, res) => {
  const { districtCode } = req.params;
  try {
    const response = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
    res.status(200).json(response.data.wards);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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