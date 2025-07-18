/**
 * Script to fix section coordinates for existing events in the database
 * 
 * Usage: 
 * node fix_seating_coordinates.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Event = require('./models/Event');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-ticketing-platform')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Function to convert seat coordinates to be relative to section
const fixSeatCoordinates = async () => {
  try {
    console.log('Starting seat coordinates fix...');
    
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
          console.log(`  Section "${section.name}" has missing coordinates, skipping...`);
          continue;
        }
        
        console.log(`  Processing section "${section.name}" at (${section.x}, ${section.y})`);
        
        // Check if section has rows and seats
        if (!Array.isArray(section.rows) || section.rows.length === 0) {
          console.log(`  Section "${section.name}" has no rows, skipping...`);
          continue;
        }
        
        // Count seats before processing
        const seatCountBefore = section.rows.reduce((count, row) => 
          count + (Array.isArray(row.seats) ? row.seats.length : 0), 0);
        
        let sectionUpdated = false;
        
        // Process each row
        for (let rowIndex = 0; rowIndex < section.rows.length; rowIndex++) {
          const row = section.rows[rowIndex];
          if (!Array.isArray(row.seats) || row.seats.length === 0) continue;
          
          // Calculate default positions for this row
          const rowHeight = section.height / Math.max(section.rows.length, 1);
          const seatWidth = section.width / Math.max(row.seats.length, 1);
          const rowY = rowIndex * rowHeight + (rowHeight / 2); // Center in row
          
          // Check if any seat has invalid coordinates
          let hasInvalidCoordinates = false;
          for (const seat of row.seats) {
            // Check for negative coordinates or coordinates outside section bounds
            if (typeof seat.x !== 'number' || typeof seat.y !== 'number' ||
                seat.x < 0 || seat.y < 0 || 
                seat.x > section.width * 1.2 || seat.y > section.height * 1.2 ||
                seat.x < -section.width || seat.y < -section.height) {
              hasInvalidCoordinates = true;
              break;
            }
          }
          
          // If any seat has invalid coordinates, fix all seats in the row
          if (hasInvalidCoordinates) {
            console.log(`    Row ${row.name} has invalid seat coordinates, fixing...`);
            
            for (let seatIndex = 0; seatIndex < row.seats.length; seatIndex++) {
              const seat = row.seats[seatIndex];
              
              // Store original coordinates for logging
              const originalX = seat.x;
              const originalY = seat.y;
              
              // Calculate new relative coordinates within the section
              seat.x = seatIndex * seatWidth + (seatWidth / 2); // Center in seat slot
              seat.y = rowY;
              
              console.log(`      Fixed seat ${row.name}-${seat.number} from (${originalX}, ${originalY}) to (${seat.x}, ${seat.y})`);
              sectionUpdated = true;
              updatedCount++;
            }
          } else {
            // Check if coordinates need normalization (make sure they're within section bounds)
            for (let seatIndex = 0; seatIndex < row.seats.length; seatIndex++) {
              const seat = row.seats[seatIndex];
              
              // If seat coordinates are within reasonable bounds, leave them as is
              if (seat.x >= 0 && seat.x <= section.width &&
                  seat.y >= 0 && seat.y <= section.height) {
                continue;
              }
              
              // Store original coordinates for logging
              const originalX = seat.x;
              const originalY = seat.y;
              
              // Calculate new relative coordinates within the section
              seat.x = seatIndex * seatWidth + (seatWidth / 2); // Center in seat slot
              seat.y = rowY;
              
              console.log(`      Normalized seat ${row.name}-${seat.number} from (${originalX}, ${originalY}) to (${seat.x}, ${seat.y})`);
              sectionUpdated = true;
              updatedCount++;
            }
          }
        }
        
        // Count seats after processing
        const seatCountAfter = section.rows.reduce((count, row) => 
          count + (Array.isArray(row.seats) ? row.seats.length : 0), 0);
        
        console.log(`  Section "${section.name}": ${seatCountBefore} seats before, ${seatCountAfter} seats after, ${updatedCount} coordinates updated`);
        
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
        console.log(`✅ Saved updated seat coordinates for event ${event._id}`);
      } else {
        console.log(`✓ No changes needed for event ${event._id}`);
      }
    }
    
    console.log(`Update complete. Updated ${updatedCount} seat coordinates in ${eventUpdatedCount} events out of ${events.length}`);
  } catch (error) {
    console.error('Error fixing seat coordinates:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the fix function
fixSeatCoordinates(); 