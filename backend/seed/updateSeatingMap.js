const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Event = require('../models/Event');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://longtpit2573:Pass123%40@eventticketdb2025.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Function to update seating map coordinates
const updateSeatingMapCoordinates = async () => {
  try {
    console.log('Starting seating map coordinates update...');
    
    // Find all events with seating template type
    const events = await Event.find({ templateType: 'seating' });
    
    console.log(`Found ${events.length} seating events`);
    
    let updatedCount = 0;
    
    for (const event of events) {
      if (!event.seatingMap || !Array.isArray(event.seatingMap.sections)) {
        console.log(`Event ${event._id} has no valid seatingMap.sections, skipping...`);
        continue;
      }
      
      const sections = event.seatingMap.sections;
      let needsUpdate = false;
      
      console.log(`Processing event: ${event.title} (${event._id}), ${sections.length} sections`);
      
      // Check if any section is missing coordinates
      for (const section of sections) {
        if (typeof section.x !== 'number' || typeof section.y !== 'number' || 
            typeof section.width !== 'number' || typeof section.height !== 'number') {
          needsUpdate = true;
          console.log(`  Found section "${section.name}" with missing coordinates`);
          break;
        }
      }
      
      if (needsUpdate) {
        console.log(`  Updating event ${event._id}`);
        
        // Default section positions for different section counts
        const defaultPositions = [
          // For 1 section
          [{ x: 400, y: 250, width: 600, height: 300 }],
          
          // For 2 sections
          [
            { x: 100, y: 250, width: 400, height: 250 },
            { x: 700, y: 250, width: 400, height: 250 }
          ],
          
          // For 3 sections
          [
            { x: 400, y: 250, width: 400, height: 200 },
            { x: 100, y: 500, width: 400, height: 200 },
            { x: 700, y: 500, width: 400, height: 200 }
          ],
          
          // For 4 sections
          [
            { x: 100, y: 250, width: 400, height: 200 },
            { x: 700, y: 250, width: 400, height: 200 },
            { x: 100, y: 500, width: 400, height: 200 },
            { x: 700, y: 500, width: 400, height: 200 }
          ],
          
          // Default for 5+ sections
          [
            { x: 100, y: 250, width: 350, height: 200 },
            { x: 525, y: 250, width: 350, height: 200 },
            { x: 950, y: 250, width: 350, height: 200 },
            { x: 100, y: 500, width: 350, height: 200 },
            { x: 525, y: 500, width: 350, height: 200 }
          ]
        ];
        
        // Select appropriate positions based on section count
        const positionSet = sections.length <= 4 
          ? defaultPositions[sections.length - 1] 
          : defaultPositions[4];
        
        // Apply default positions to sections
        sections.forEach((section, index) => {
          // Use position set if available, otherwise calculate based on index
          const position = index < positionSet.length 
            ? positionSet[index]
            : {
                x: 100 + (index % 3) * 425,
                y: 250 + Math.floor(index / 3) * 250,
                width: 350,
                height: 200
              };
          
          // Update section coordinates
          if (typeof section.x !== 'number') section.x = position.x;
          if (typeof section.y !== 'number') section.y = position.y;
          if (typeof section.width !== 'number') section.width = position.width;
          if (typeof section.height !== 'number') section.height = position.height;
          
          console.log(`    Updated section "${section.name}" to position (${section.x}, ${section.y})`);
          
          // Update seat coordinates to be relative to section
          if (Array.isArray(section.rows)) {
            section.rows.forEach((row, rowIndex) => {
              if (Array.isArray(row.seats)) {
                const rowHeight = section.height / section.rows.length;
                const seatWidth = section.width / (row.seats.length || 1);
                
                row.seats.forEach((seat, seatIndex) => {
                  // Only update seats with invalid or very large coordinates
                  if (typeof seat.x !== 'number' || typeof seat.y !== 'number' || 
                      seat.x > 1000 || seat.y > 1000) {
                    seat.x = seatIndex * seatWidth + (seatWidth / 2);
                    seat.y = rowIndex * rowHeight + (rowHeight / 2);
                    console.log(`      Updated seat ${row.name}${seat.number} to relative position (${seat.x}, ${seat.y})`);
                  }
                });
              }
            });
          }
        });
        
        // Mark seatingMap as modified to ensure it saves correctly
        event.markModified('seatingMap');
        await event.save();
        updatedCount++;
        console.log(`  ✅ Saved updated seating map for event ${event._id}`);
      } else {
        console.log(`  ✓ Event ${event._id} has valid section coordinates, no update needed`);
      }
    }
    
    console.log(`Update complete. Updated ${updatedCount} events out of ${events.length}`);
  } catch (error) {
    console.error('Error updating seating maps:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the update function
updateSeatingMapCoordinates(); 