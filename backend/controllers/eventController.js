const Event = require('../models/Event');
const Venue = require('../models/Venue');
const User = require('../models/User');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

// Create a new event
const createEvent = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, organizers, venue, status, capacity, availableSeats } = req.body;

  // Validate required fields
  if (!title || !description || !startDate || !endDate || !organizers || !venue) {
    res.status(400);
    throw new Error('Vui lòng cung cấp đầy đủ thông tin: title, description, startDate, endDate, organizers, venue');
  }

  // Validate dates
  if (new Date(startDate) > new Date(endDate)) {
    res.status(400);
    throw new Error('Ngày bắt đầu không thể sau ngày kết thúc');
  }

  // Validate capacity and available seats
  if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1)) {
    res.status(400);
    throw new Error('Sức chứa phải là số nguyên dương');
  }

  if (availableSeats !== undefined && (!Number.isInteger(availableSeats) || availableSeats < 0)) {
    res.status(400);
    throw new Error('Số ghế khả dụng không thể âm');
  }

  if (availableSeats > capacity) {
    res.status(400);
    throw new Error('Số ghế khả dụng không thể vượt quá sức chứa');
  }

  // Validate organizers (check if they are valid ObjectIds and exist)
  if (!Array.isArray(organizers) || organizers.length === 0) {
    res.status(400);
    throw new Error('Organizers phải là một mảng không rỗng chứa ObjectId');
  }

  const invalidOrganizers = organizers.filter(id => !mongoose.Types.ObjectId.isValid(id));
  if (invalidOrganizers.length > 0) {
    res.status(400);
    throw new Error(`Các giá trị không phải ObjectId hợp lệ: ${invalidOrganizers.join(', ')}`);
  }

  const organizerExists = await User.find({ _id: { $in: organizers } });
  if (organizerExists.length !== organizers.length) {
    res.status(400);
    throw new Error('Một hoặc nhiều người tổ chức không tồn tại');
  }

  // Validate venue exists and populate location
  if (!mongoose.Types.ObjectId.isValid(venue)) {
    res.status(400);
    throw new Error('Venue phải là một ObjectId hợp lệ');
  }

  const venueData = await Venue.findById(venue).lean();
  if (!venueData) {
    res.status(400);
    throw new Error('Địa điểm không tồn tại');
  }

  // Đảm bảo các trường trong location có giá trị, nếu không thì gán mặc định
  const eventData = {
    title,
    description,
    startDate,
    endDate,
    organizers,
    location: {
      venue,
      address: venueData.address || 'Không xác định',
      city: venueData.city || 'Không xác định',
      country: venueData.country || 'Vietnam'
    },
    status: status || 'draft',
    capacity,
    availableSeats
  };

  const event = await Event.create(eventData);

  // Populate organizers and venue
  const populatedEvent = await Event.findById(event._id)
    .populate('organizers', 'name email')
    .populate('location.venue', 'name address')
    .lean();

  res.status(201).json({
    success: true,
    data: populatedEvent
  });
});

// Get all events
const getEvents = asyncHandler(async (req, res) => {
  const { visibility } = req.query; // Sửa từ req query thành req.query
  const query = visibility ? { visibility } : {};
  const events = await Event.find(query)
    .populate('organizers', 'name email')
    .populate('location.venue', 'name address')
    .lean();
  res.status(200).json({
    success: true,
    data: events
  });
});

// Get a single event by ID
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('organizers', 'name email')
    .populate('location.venue', 'name address')
    .lean();
  if (!event) {
    res.status(404);
    throw new Error(`Không tìm thấy sự kiện với ID ${req.params.id}`);
  }
  res.status(200).json({
    success: true,
    data: event
  });
});

// Update an event
const updateEvent = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, organizers, venue, status, capacity, availableSeats } = req.body;
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error(`Không tìm thấy sự kiện với ID ${req.params.id}`);
  }

  // Validate organizers if provided
  if (organizers) {
    if (!Array.isArray(organizers) || organizers.length === 0) {
      res.status(400);
      throw new Error('Organizers phải là một mảng không rỗng chứa ObjectId');
    }

    const invalidOrganizers = organizers.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidOrganizers.length > 0) {
      res.status(400);
      throw new Error(`Các giá trị không phải ObjectId hợp lệ: ${invalidOrganizers.join(', ')}`);
    }

    const organizerExists = await User.find({ _id: { $in: organizers } });
    if (organizerExists.length !== organizers.length) {
      res.status(400);
      throw new Error('Một hoặc nhiều người tổ chức không tồn tại');
    }
    event.organizers = organizers;
  }

  // Validate venue if provided and update location
  if (venue) {
    if (!mongoose.Types.ObjectId.isValid(venue)) {
      res.status(400);
      throw new Error('Venue phải là một ObjectId hợp lệ');
    }

    const venueData = await Venue.findById(venue).lean();
    if (!venueData) {
      res.status(400);
      throw new Error('Địa điểm không tồn tại');
    }
    event.location = {
      venue,
      address: venueData.address || 'Không xác định',
      city: venueData.city || 'Không xác định',
      country: venueData.country || 'Vietnam'
    };
  }

  // Update fields
  event.title = title || event.title;
  event.description = description || event.description;
  event.startDate = startDate || event.startDate;
  event.endDate = endDate || event.endDate;
  event.status = status || event.status;
  event.capacity = capacity !== undefined ? capacity : event.capacity;
  event.availableSeats = availableSeats !== undefined ? availableSeats : event.availableSeats;

  // Validate dates
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    res.status(400);
    throw new Error('Ngày bắt đầu không thể sau ngày kết thúc');
  }

  // Validate capacity and available seats
  if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1)) {
    res.status(400);
    throw new Error('Sức chứa phải là số nguyên dương');
  }

  if (availableSeats !== undefined && (!Number.isInteger(availableSeats) || availableSeats < 0)) {
    res.status(400);
    throw new Error('Số ghế khả dụng không thể âm');
  }

  if (availableSeats > capacity) {
    res.status(400);
    throw new Error('Số ghế khả dụng không thể vượt quá sức chứa');
  }

  const updatedEvent = await event.save();

  // Populate organizers and venue
  const populatedEvent = await Event.findById(updatedEvent._id)
    .populate('organizers', 'name email')
    .populate('location.venue', 'name address')
    .lean();

  res.status(200).json({
    success: true,
    data: populatedEvent
  });
});

// Delete an event
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error(`Không tìm thấy sự kiện với ID ${req.params.id}`);
  }

  await event.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Sự kiện đã được xóa thành công'
  });
});

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
};