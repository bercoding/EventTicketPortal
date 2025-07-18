// Đây là đoạn code cần được thay thế trong eventController.js

// Process seatingMap to update ticketTier references with actual ticket type IDs
if (createdEvent.seatingMap && createdEvent.seatingMap.sections && createdEvent.seatingMap.sections.length > 0) {
  console.log(`🎫 Processing seatingMap for event...`);
  console.log(`🎫 Available ticket types: ${ticketTypeIds.length}`);
  
  // Kiểm tra và log chi tiết về layout hiện tại
  console.log(`🎭 Current seating map has ${createdEvent.seatingMap.sections.length} sections`);
  createdEvent.seatingMap.sections.forEach((section, index) => {
    console.log(`Section ${index + 1}: name=${section.name || 'unnamed'}, position=(${section.x || 'undefined'}, ${section.y || 'undefined'}), size=(${section.width || 'undefined'} x ${section.height || 'undefined'})`);
  });
  
  // Đảm bảo biến useFixedLayout được khởi tạo
  let useFixedLayout = false;
  
  // Check if sections have valid coordinates and dimensions
  const hasInvalidSections = createdEvent.seatingMap.sections.some(section => 
    typeof section.x !== 'number' || 
    typeof section.y !== 'number' ||
    typeof section.width !== 'number' || 
    typeof section.height !== 'number'
  );
  
  if (hasInvalidSections) {
    console.log("🎭 Found sections with invalid coordinates, using fixed layout");
    useFixedLayout = true;
  } else {
    // Không kiểm tra rows và seats nữa, chỉ cần có sections với tọa độ hợp lệ
    console.log("🎭 Sections have valid coordinates, keeping custom layout");
  }
  
  // If we need to regenerate the seating map, do it here
  if (useFixedLayout) {
    console.log("🎭 Generating fixed seating layout");
    // Make sure createFixedLayout is properly defined and called
    const fixedLayout = typeof createFixedLayout === 'function' ? createFixedLayout() : {
      layoutType: 'theater', 
      sections: [
        {
          name: "Khu 1 (Vé Thường)",
          x: 100,
          y: 250,
          width: 350,
          height: 200,
          rows: []
        },
        {
          name: "Khu 2 (Vé VIP)", 
          x: 650,
          y: 250,
          width: 350,
          height: 200,
          rows: []
        }
      ],
      stage: { x: 400, y: 80, width: 400, height: 100 },
      venueObjects: []
    };
    
    // Assign different ticket types to different sections
    if (ticketTypeIds.length > 0 && fixedLayout.sections && fixedLayout.sections.length > 0) {
      // First section gets first ticket type (Vé Thường)
      fixedLayout.sections[0].ticketTier = ticketTypeIds[0];
      
      // Second section gets second ticket type (Vé VIP) if available, otherwise first ticket type
      if (ticketTypeIds.length > 1 && fixedLayout.sections.length > 1) {
        fixedLayout.sections[1].ticketTier = ticketTypeIds[1];
      } else if (fixedLayout.sections.length > 1) {
        fixedLayout.sections[1].ticketTier = ticketTypeIds[0];
      }
      
      console.log(`🎫 Assigned ticket types to sections: Section 1 -> ${ticketTypeIds[0]}, Section 2 -> ${fixedLayout.sections.length > 1 ? (ticketTypeIds.length > 1 ? ticketTypeIds[1] : ticketTypeIds[0]) : 'N/A'}`);
    }
    
    // Update the event with the new seating map
    createdEvent.seatingMap = fixedLayout;
    await createdEvent.save();
    console.log("✅ Fixed seating layout saved to event");
  } else {
    // Otherwise, just update the ticket tiers in the existing seating map
    let ticketTierIndex = 0;
    for (const section of createdEvent.seatingMap.sections) {
      // Ensure each section has a ticketTier associated with it
      if (!section.ticketTier && ticketTypeIds.length > 0) {
        section.ticketTier = ticketTypeIds[ticketTierIndex % ticketTypeIds.length];
        ticketTierIndex++;
      }
      
      // Ensure each section has rows and seats if needed
      if (!Array.isArray(section.rows) || section.rows.length === 0) {
        console.log(`🎭 Creating rows and seats for section ${section.name || 'unnamed'}`);
        
        // Calculate rows and seats based on section dimensions
        const sectionWidth = section.width || 300;
        const sectionHeight = section.height || 200;
        
        // Calculate reasonable number of rows and seats per row
        const numRows = Math.max(5, Math.floor(sectionHeight / 40));
        const seatsPerRow = Math.max(10, Math.floor(sectionWidth / 30));
        
        // Create rows and seats
        const rows = [];
        for (let i = 0; i < numRows; i++) {
          const rowName = String.fromCharCode(65 + i); // A, B, C...
          const seats = [];
          
          const rowY = i * (sectionHeight / numRows);
          
          for (let j = 0; j < seatsPerRow; j++) {
            const seatX = j * (sectionWidth / seatsPerRow);
            
            seats.push({
              number: `${j + 1}`,
              status: 'available',
              x: seatX + 15, // Center in cell
              y: rowY + 15
            });
          }
          
          rows.push({
            name: rowName,
            seats: seats
          });
        }
        
        // Update the section with the generated rows
        section.rows = rows;
      }
    }
    
    await createdEvent.save();
    console.log("✅ Updated ticket tiers and generated seats in seating map");
  }
} else {
  // If there's no seating map at all, create one using fixed layout
  console.log("🎭 No seating map found, creating a fixed layout");
  // Make sure createFixedLayout is properly defined and called
  const fixedLayout = typeof createFixedLayout === 'function' ? createFixedLayout() : {
    layoutType: 'theater', 
    sections: [
      {
        name: "Khu 1 (Vé Thường)",
        x: 100,
        y: 250,
        width: 350,
        height: 200,
        rows: []
      },
      {
        name: "Khu 2 (Vé VIP)", 
        x: 650,
        y: 250,
        width: 350,
        height: 200,
        rows: []
      }
    ],
    stage: { x: 400, y: 80, width: 400, height: 100 },
    venueObjects: []
  };
  
  // Assign different ticket types to different sections
  if (ticketTypeIds.length > 0 && fixedLayout.sections && fixedLayout.sections.length > 0) {
    // First section gets first ticket type (Vé Thường)
    fixedLayout.sections[0].ticketTier = ticketTypeIds[0];
    
    // Second section gets second ticket type (Vé VIP) if available, otherwise first ticket type
    if (ticketTypeIds.length > 1 && fixedLayout.sections.length > 1) {
      fixedLayout.sections[1].ticketTier = ticketTypeIds[1];
    } else if (fixedLayout.sections.length > 1) {
      fixedLayout.sections[1].ticketTier = ticketTypeIds[0];
    }
    
    console.log(`🎫 Assigned ticket types to sections: Section 1 -> ${ticketTypeIds[0]}, Section 2 -> ${fixedLayout.sections.length > 1 ? (ticketTypeIds.length > 1 ? ticketTypeIds[1] : ticketTypeIds[0]) : 'N/A'}`);
  }
  
  createdEvent.seatingMap = fixedLayout;
  
  // Preserve original layout type if available
  if (seatingMap && seatingMap.layoutType) {
    createdEvent.seatingMap.layoutType = seatingMap.layoutType;
    console.log(`✅ Preserved original layout type: ${seatingMap.layoutType}`);
  }
  
  // Preserve original venue objects if available
  if (seatingMap && Array.isArray(seatingMap.venueObjects) && seatingMap.venueObjects.length > 0) {
    createdEvent.seatingMap.venueObjects = JSON.parse(JSON.stringify(seatingMap.venueObjects));
    console.log(`✅ Preserved ${seatingMap.venueObjects.length} original venue objects even with fixed layout`);
  }
  
  // Preserve original stage if available
  if (seatingMap && seatingMap.stage) {
    createdEvent.seatingMap.stage = JSON.parse(JSON.stringify(seatingMap.stage));
    console.log(`✅ Preserved original stage position even with fixed layout`);
  }
  
  await createdEvent.save();
  console.log("✅ Fixed seating layout created and saved to event");
}
