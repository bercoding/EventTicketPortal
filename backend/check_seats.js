const mongoose = require('mongoose');
require('dotenv').config();
const Event = require('./models/Event');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-ticketing-platform')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Function to check seat coordinates
const checkSeatCoordinates = async () => {
  try {
    console.log('Checking seat coordinates...');
    
    // Find a seating event
    const event = await Event.findOne({ templateType: 'seating' });
    
    if (!event) {
      console.log('No seating event found');
      return;
    }
    
    console.log(`Event: ${event.title} (${event._id})`);
    
    if (!event.seatingMap || !Array.isArray(event.seatingMap.sections)) {
      console.log('Event has no seating map sections');
      return;
    }
    
    console.log(`Sections: ${event.seatingMap.sections.length}`);
    
    // Check each section
    event.seatingMap.sections.forEach((section, sectionIndex) => {
      console.log(`\nSection ${sectionIndex + 1}: ${section.name}`);
      console.log(`  Position: (${section.x}, ${section.y})`);
      console.log(`  Size: ${section.width}x${section.height}`);
      
      if (!Array.isArray(section.rows)) {
        console.log('  No rows in this section');
        return;
      }
      
      console.log(`  Rows: ${section.rows.length}`);
      
      // Check first few rows
      section.rows.slice(0, 2).forEach((row, rowIndex) => {
        console.log(`  Row ${rowIndex + 1}: ${row.name}`);
        
        if (!Array.isArray(row.seats)) {
          console.log('    No seats in this row');
          return;
        }
        
        console.log(`    Seats: ${row.seats.length}`);
        
        // Check first few seats
        row.seats.slice(0, 5).forEach((seat, seatIndex) => {
          console.log(`    Seat ${seatIndex + 1}: ${seat.number} at (${seat.x}, ${seat.y})`);
        });
      });
    });
  } catch (error) {
    console.error('Error checking seat coordinates:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the check function
checkSeatCoordinates(); 