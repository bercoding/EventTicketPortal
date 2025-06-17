const Event = require('../models/Event');
const Venue = require('../models/Venue');
const User = require('../models/User');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

// Create a new event
const createEvent = asyncHandler(async (req, res) => {
  const { 
    title, description, images, startDate, endDate, location, category, tags,
    capacity, visibility, status, detailedDescription, termsAndConditions, organizer,
    organizers, seatingMap // Add seatingMap here
  } = req.body;

  console.log('Received organizer in createEvent:', organizer);

  // Validate required fields
  if (!title || !description || !startDate || !endDate || !organizers || organizers.length === 0 || !location || !location.venueName || !location.address || !location.city) {
    res.status(400);
    throw new Error('Vui lòng cung cấp đầy đủ thông tin: title, description, startDate, endDate, organizers, venueName, address, city');
  }

  // Validate dates
  if (new Date(startDate) > new Date(endDate)) {
    res.status(400);
    throw new Error('Ngày bắt đầu không thể sau ngày kết thúc');
  }

  // Validate capacity
  if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1)) {
    res.status(400);
    throw new Error('Sức chứa phải là số nguyên dương');
  }

  // Validate organizers (check if they are valid ObjectIds and exist)
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

  // Find or create venue based on provided location details
  let venueId;
  if (location.type === 'offline') {
  const existingVenue = await Venue.findOne({
    name: location.venueName,
    address: location.address,
    city: location.city
  });

  if (existingVenue) {
    venueId = existingVenue._id;
  } else {
    const newVenue = await Venue.create({
      name: location.venueName,
      address: location.address,
        ward: location.ward,
        district: location.district,
      city: location.city,
        country: location.country || 'Vietnam',
    });
    venueId = newVenue._id;
    }
  }

  const eventData = {
    title,
    description,
    images: images || { logo: '', banner: '' }, // Ensure images are an object
    startDate,
    endDate,
    organizers,
    location: {
      type: location.type,
      venue: venueId, // Only include venueId for offline events
      venueName: location.venueName,
      address: location.address,
      ward: location.ward,
      district: location.district,
      city: location.city,
      country: location.country || 'Vietnam',
      venueLayout: location.venueLayout // Include venueLayout
    },
    category: category || [],
    tags: tags || [],
    capacity,
    visibility: visibility || 'public',
    status: status || 'pending',
    detailedDescription: detailedDescription || { mainProgram: '', guests: '', specialExperiences: '' },
    termsAndConditions: termsAndConditions || '',
    eventOrganizerDetails: organizer || { logo: '', name: '', info: '' }, // Map frontend 'organizer' to backend 'eventOrganizerDetails'
    availableSeats: capacity, // Initialize availableSeats with capacity
    seatingMap: seatingMap || { layout: {}, sections: [] } // Include seatingMap
  };

  const event = await Event.create(eventData);

  // Populate organizers and venue
  const populatedEvent = await Event.findById(event._id)
    .populate('organizers', 'username email fullName avatar') // Populate more user fields
    .populate('location.venue', 'name address')
    .lean();

  res.status(201).json({
    success: true,
    data: populatedEvent
  });
});

// Get all events
const getEvents = asyncHandler(async (req, res) => {
  const { visibility } = req.query;
  const query = visibility ? { visibility } : {};
  const events = await Event.find(query)
    .populate('organizers', 'username email fullName avatar') // Populate more user fields
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
    .populate('organizers', 'username email fullName avatar') // Populate more user fields
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
  const { title, description, images, startDate, endDate, organizers, location, category, tags,
    capacity, visibility, status, detailedDescription, termsAndConditions, organizer,
    availableSeats, seatingMap } = req.body;
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error(`Không tìm thấy sự kiện với ID ${req.params.id}`);
  }

  // Update fields
  event.title = title !== undefined ? title : event.title;
  event.description = description !== undefined ? description : event.description;
  event.images = images !== undefined ? images : event.images;
  event.startDate = startDate !== undefined ? startDate : event.startDate;
  event.endDate = endDate !== undefined ? endDate : event.endDate;
  event.category = category !== undefined ? category : event.category;
  event.tags = tags !== undefined ? tags : event.tags;
  event.capacity = capacity !== undefined ? capacity : event.capacity;
  event.visibility = visibility !== undefined ? visibility : event.visibility;
  event.status = status !== undefined ? status : event.status;
  event.detailedDescription = detailedDescription !== undefined ? detailedDescription : event.detailedDescription;
  event.termsAndConditions = termsAndConditions !== undefined ? termsAndConditions : event.termsAndConditions;
  event.eventOrganizerDetails = organizer !== undefined ? organizer : event.eventOrganizerDetails; // Map frontend 'organizer' to backend 'eventOrganizerDetails'
  event.availableSeats = availableSeats !== undefined ? availableSeats : event.availableSeats;

  // Handle location update
  if (location) {
    event.location.type = location.type !== undefined ? location.type : event.location.type;
    event.location.venueName = location.venueName !== undefined ? location.venueName : event.location.venueName;
    event.location.address = location.address !== undefined ? location.address : event.location.address;
    event.location.ward = location.ward !== undefined ? location.ward : event.location.ward;
    event.location.district = location.district !== undefined ? location.district : event.location.district;
    event.location.city = location.city !== undefined ? location.city : event.location.city;
    event.location.country = location.country !== undefined ? location.country : event.location.country;
    event.location.venueLayout = location.venueLayout !== undefined ? location.venueLayout : event.location.venueLayout; // Include venueLayout

    if (location.type === 'offline') {
      let venueId;
      const existingVenue = await Venue.findOne({
        name: location.venueName || event.location.venueName,
        address: location.address || event.location.address,
        city: location.city || event.location.city
      });

      if (existingVenue) {
        venueId = existingVenue._id;
      } else {
        const newVenue = await Venue.create({
          name: location.venueName || event.location.venueName,
          address: location.address || event.location.address,
          ward: location.ward || event.location.ward,
          district: location.district || event.location.district,
          city: location.city || event.location.city,
          country: location.country || event.location.country || 'Vietnam',
        });
        venueId = newVenue._id;
      }
      event.location.venue = venueId;
    } else {
      event.location.venue = undefined; // Clear venue for online events
    }
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

  // Handle seatingMap update
  if (seatingMap) {
    event.seatingMap = seatingMap; // Directly assign the new seating map
  }

  const updatedEvent = await event.save();

  // Populate organizers and venue
  const populatedEvent = await Event.findById(updatedEvent._id)
    .populate('organizers', 'username email fullName avatar') // Populate more user fields
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

// Get events by owner ID
const getEventsByOwnerId = asyncHandler(async (req, res) => {
  const { ownerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(ownerId)) {
    res.status(400);
    throw new Error('ID người sở hữu không hợp lệ');
  }

  const events = await Event.find({ organizers: ownerId })
    .populate('organizers', 'username email fullName avatar')
    .populate('location.venue', 'name address')
    .lean();

  res.status(200).json({
    success: true,
    data: events
  });
});

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByOwnerId,
};