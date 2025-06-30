const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');
const TicketType = require('./models/TicketType');
const Venue = require('./models/Venue');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-ticketing-platform');
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const debugEvents = async () => {
  try {
    console.log('🔍 Testing Event queries...');
    
    // Test 1: Count all events
    const totalCount = await Event.countDocuments({});
    console.log('📊 Total events in DB:', totalCount);
    
    // Test 2: Count approved events
    const approvedCount = await Event.countDocuments({ status: 'approved' });
    console.log('✅ Approved events count:', approvedCount);
    
    // Test 3: Find with simple query
    const simpleEvents = await Event.find({ status: 'approved' }).select('title status').limit(3);
    console.log('📋 Simple query results:', simpleEvents);
    
    // Test 4: Find with populate (problematic?)
    console.log('🔄 Testing populate...');
    try {
      const populatedEvents = await Event.find({ status: 'approved' })
        .populate('organizers', 'username email fullName avatar')
        .populate('location.venue', 'name address')
        .populate('ticketTypes')
        .limit(2)
        .lean();
      console.log('✅ Populate successful, count:', populatedEvents.length);
      if (populatedEvents.length > 0) {
        console.log('📝 First event:', populatedEvents[0].title);
        console.log('👥 Organizers:', populatedEvents[0].organizers);
        console.log('🎫 TicketTypes:', populatedEvents[0].ticketTypes);
      }
    } catch (populateError) {
      console.error('❌ Populate failed:', populateError.message);
      
      // Test without problematic populate
      console.log('🔄 Testing without populate...');
      const nopopEvents = await Event.find({ status: 'approved' }).limit(2).lean();
      console.log('✅ No populate successful, count:', nopopEvents.length);
    }
    
    // Test 5: Check ticket types separately
    const ticketTypeCount = await TicketType.countDocuments({});
    console.log('🎫 Total ticket types:', ticketTypeCount);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
};

const main = async () => {
  await connectDB();
  await debugEvents();
  process.exit(0);
};

main(); 