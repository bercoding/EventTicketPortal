const mongoose = require('mongoose');
require('dotenv').config();
const Event = require('./models/Event');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://longtpit2573:Pass123%40@eventticketdb2025.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Function to fix seat positions
const fixSeatPositions = async () => {
  try {
    console.log('Starting seat positions fix...');
    
    // Find all events with seating template type
    const events = await Event.find({ templateType: 'seating' });
    
    console.log(`Found ${events.length} seating events`);
    
    let updatedCount = 0;
    let eventUpdatedCount = 0;
    
    for (const event of events) {
      if (!event.seatingMap || !Array.isArray(event.seatingMap.sections)) {
        console.log(`Event ${event._id} has no valid seatingMap.sections, skipping...`);
        continue;
      }
      
      const sections = event.seatingMap.sections;
      let eventNeedsUpdate = false;
      
      console.log(`Processing event: ${event.title} (${event._id}), ${sections.length} sections`);
      
      // Process each section
      for (const section of sections) {
        if (typeof section.x !== 'number' || typeof section.y !== 'number' || 
            typeof section.width !== 'number' || typeof section.height !== 'number') {
          console.log(`  Section "${section.name}" has missing dimensions, skipping...`);
          continue;
        }
        
        console.log(`  Processing section "${section.name}" at (${section.x}, ${section.y}), size: ${section.width}x${section.height}`);
        
        // Check if section has rows and seats
        if (!Array.isArray(section.rows) || section.rows.length === 0) {
          console.log(`  Section "${section.name}" has no rows, skipping...`);
          continue;
        }
        
        // Count seats before processing
        const seatCountBefore = section.rows.reduce((count, row) => 
          count + (Array.isArray(row.seats) ? row.seats.length : 0), 0);
        
        let sectionUpdated = false;
        
        // Calculate total rows and max seats in any row
        const totalRows = section.rows.length;
        const maxSeatsInRow = Math.max(...section.rows.map(r => r.seats ? r.seats.length : 0));
        
        // Calculate spacing
        const seatSpacingX = section.width / (maxSeatsInRow + 1);
        const seatSpacingY = section.height / (totalRows + 1);
        
        console.log(`  Section has ${totalRows} rows, max ${maxSeatsInRow} seats per row`);
        console.log(`  Calculated spacing: X=${seatSpacingX.toFixed(2)}, Y=${seatSpacingY.toFixed(2)}`);
        
        // Process each row
        for (let rowIndex = 0; rowIndex < section.rows.length; rowIndex++) {
          const row = section.rows[rowIndex];
          if (!Array.isArray(row.seats) || row.seats.length === 0) continue;
          
          console.log(`    Row ${row.name}: ${row.seats.length} seats`);
          
          // Process each seat
          for (let seatIndex = 0; seatIndex < row.seats.length; seatIndex++) {
            const seat = row.seats[seatIndex];
            
            // Store original coordinates for logging
            const originalX = seat.x;
            const originalY = seat.y;
            
            // Calculate new relative coordinates within the section
            // Position seats evenly within the section
            seat.x = (seatIndex + 1) * seatSpacingX;
            seat.y = (rowIndex + 1) * seatSpacingY;
            
            if (seatIndex === 0) {
              console.log(`      First seat: from (${originalX}, ${originalY}) to (${seat.x}, ${seat.y})`);
            }
            
            sectionUpdated = true;
            updatedCount++;
          }
        }
        
        // Count seats after processing
        const seatCountAfter = section.rows.reduce((count, row) => 
          count + (Array.isArray(row.seats) ? row.seats.length : 0), 0);
        
        console.log(`  Section "${section.name}": ${seatCountBefore} seats before, ${seatCountAfter} seats after, updated coordinates`);
        
        if (sectionUpdated) {
          eventNeedsUpdate = true;
        }
      }
      
      // Save event if any section was updated
      if (eventNeedsUpdate) {
        // Mark seatingMap as modified to ensure it saves correctly
        event.markModified('seatingMap');
        await event.save();
        eventUpdatedCount++;
        console.log(`✅ Saved updated seat positions for event ${event._id}`);
      } else {
        console.log(`✓ No changes needed for event ${event._id}`);
      }
    }
    
    console.log(`Update complete. Updated ${updatedCount} seat positions in ${eventUpdatedCount} events out of ${events.length}`);
  } catch (error) {
    console.error('Error fixing seat positions:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the fix function
fixSeatPositions(); 