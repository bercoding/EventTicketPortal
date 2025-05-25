const Event = require('../models/Event');
const asyncHandler = require('express-async-handler');

// Create a new event
const createEvent = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, organizers, venue, status, capacity, availableSeats } = req.body;

  // Validate dates
  if (new Date(startDate) > new Date(endDate)) {
    res.status(400);
    throw new Error('Start date cannot be after end date');
  }

  if (availableSeats > capacity) {
    res.status(400);
    throw new Error('Available seats cannot exceed capacity');
  }

  const event = await Event.create({
    title,
    description,
    startDate,
    endDate,
    organizers,
    venue,
    status: status || 'upcoming',
    capacity,
    availableSeats
  });

  // Populate organizers and venue
  const populatedEvent = await Event.findById(event._id).populate('organizers venue').lean();

  if (!populatedEvent.organizers || !populatedEvent.venue) {
    console.log('Populate failed: Check if User or Venue exists with IDs:', organizers, venue);
  }

  res.status(201).json({
    success: true,
    data: populatedEvent
  });
});

// Get all events
const getEvents = asyncHandler(async (req, res) => {
  const events = await Event.find().populate('organizers venue').lean();
  res.status(200).json({
    success: true,
    data: events
  });
});

// Get a single event by ID
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizers venue').lean();
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  if (!event.organizers || !event.venue) {
    console.log('Populate failed for event:', req.params.id, 'Check IDs:', event.organizers, event.venue);
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
    throw new Error('Event not found');
  }

  event.title = title || event.title;
  event.description = description || event.description;
  event.startDate = startDate || event.startDate;
  event.endDate = endDate || event.endDate;
  event.organizers = organizers || event.organizers;
  event.venue = venue || event.venue;
  event.status = status || event.status;
  event.capacity = capacity !== undefined ? capacity : event.capacity;
  event.availableSeats = availableSeats !== undefined ? availableSeats : event.availableSeats;

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    res.status(400);
    throw new Error('Start date cannot be after end date');
  }

  if (availableSeats > capacity) {
    res.status(400);
    throw new Error('Available seats cannot exceed capacity');
  }

  const updatedEvent = await event.save();

  // Populate organizers and venue
  const populatedEvent = await Event.findById(updatedEvent._id).populate('organizers venue').lean();

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
    throw new Error('Event not found');
  }

  await event.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Event deleted successfully'
  });
});

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
};