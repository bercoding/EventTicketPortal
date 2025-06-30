const Event = require('../models/Event');
const Venue = require('../models/Venue');
const User = require('../models/User');
const TicketType = require('../models/TicketType');
const Ticket = require('../models/Ticket');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// Create a new event (original version)
const createEvent = asyncHandler(async (req, res) => {
  const { 
    title, description, images, startDate, endDate, location, category, tags,
    capacity, visibility, status, detailedDescription, termsAndConditions, organizer,
    organizers, seatingMap
  } = req.body;

  console.log('Received organizer in createEvent:', organizer);

  // Validate required fields
  if (!title || !description || !startDate || !endDate || !organizers || organizers.length === 0 || !location || !location.venueName || !location.address || !location.city) {
    res.status(400);
    throw new Error('Vui lòng cung cấp đầy đủ thông tin: title, description, startDate, endDate, organizers, venueName, address, city');
  }

  // Validate dates
  if (new Date(startDate) >= new Date(endDate)) {
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
    images: images || {},
    startDate,
    endDate,
    organizers,
    location: {
      type: location.type,
      venue: venueId,
      venueName: location.venueName,
      address: location.address,
      ward: location.ward,
      district: location.district,
      city: location.city,
      country: location.country || 'Vietnam',
      venueLayout: location.venueLayout
    },
    category: category || [],
    tags: tags || [],
    capacity,
    visibility: visibility || 'public',
    status: status || 'pending',
    detailedDescription: detailedDescription || { mainProgram: '', guests: '', specialExperiences: '' },
    termsAndConditions: termsAndConditions || '',
    eventOrganizerDetails: organizer || { logo: '', name: '', info: '' },
    availableSeats: capacity,
    seatingMap: seatingMap || { layout: {}, sections: [] }
  };

  const event = await Event.create(eventData);

  // Populate organizers and venue
  const populatedEvent = await Event.findById(event._id)
    .populate('organizers', 'username email fullName avatar')
    .populate('location.venue', 'name address')
    .lean();

  res.status(201).json({
    success: true,
    data: populatedEvent
  });
});

// Helper function để tạo màu sắc mặc định cho ticket types
const getDefaultColorForTicketType = (ticketName) => {
  const name = ticketName?.toLowerCase() || '';
  if (name.includes('golden')) return '#F59E0B'; // Màu cam vàng cho Golden
  if (name.includes('vip')) return '#8B5CF6'; // Màu tím cho VIP  
  if (name.includes('a')) return '#3B82F6'; // Màu xanh dương cho khu A
  if (name.includes('b')) return '#10B981'; // Màu xanh lá cho khu B
  if (name.includes('c')) return '#F97316'; // Màu cam cho khu C
  if (name.includes('d')) return '#EF4444'; // Màu đỏ cho khu D
  if (name.includes('thường')) return '#6B7280'; // Màu xám cho vé thường
  return '#6B7280'; // Màu xám mặc định
};

// Tạo sự kiện với tùy chọn số ghế/khu cho Event Owner
const createEventWithSeating = asyncHandler(async (req, res) => {
  const { 
    title, description, images, startDate, endDate, location, category, tags,
    visibility, status, detailedDescription, termsAndConditions, organizer,
    seatOptions, customSeatingMap, designMode, ticketTypes: ticketTypesData, templateType
  } = req.body;

  console.log('🎭 Creating event with design mode:', designMode);
  console.log('🎭 Seat options:', seatOptions);
  console.log('🎭 Custom seating map:', customSeatingMap ? 'provided' : 'not provided');

  // Validate required fields
  if (!title || !description || !startDate || !endDate) {
    res.status(400);
    throw new Error('Vui lòng cung cấp đầy đủ thông tin: title, description, startDate, endDate');
  }

  // Xác định loại template
  const isOnlineEvent = templateType === 'online';
  const isGeneralEvent = templateType === 'general';
  const isSeatingEvent = templateType === 'seating';

  // Validation khác nhau cho từng template
  if (isOnlineEvent) {
    // Online event - cần link tham gia
    if (!location?.meetingLink) {
      res.status(400);
      throw new Error('Vui lòng cung cấp link tham gia cho sự kiện online');
    }
  } else {
    // Offline event - cần địa điểm
    if (!location?.venueName || !location?.address) {
      res.status(400);
      throw new Error('Vui lòng cung cấp đầy đủ thông tin địa điểm cho sự kiện offline');
    }
  }

  // Chỉ validate seating cho sự kiện có ghế ngồi
  if (isSeatingEvent) {
    if (designMode === 'template') {
    if (!seatOptions || !seatOptions.totalSeats || !seatOptions.totalSections) {
      res.status(400);
      throw new Error('Vui lòng cung cấp thông tin về số ghế và số khu');
      }
    } else if (designMode === 'custom') {
      if (!customSeatingMap || !customSeatingMap.sections || customSeatingMap.sections.length === 0) {
        res.status(400);
        throw new Error('Vui lòng thiết kế sơ đồ chỗ ngồi hoặc chọn template');
      }
    }
  }

  if (!ticketTypesData || !Array.isArray(ticketTypesData) || ticketTypesData.length === 0) {
    res.status(400);
    throw new Error('Vui lòng cung cấp ít nhất một loại vé.');
  }

  // Validate dates
  if (new Date(startDate) >= new Date(endDate)) {
    res.status(400);
    throw new Error('Ngày bắt đầu không thể sau ngày kết thúc');
  }

  // Tính capacity dựa trên template và design mode
  let eventCapacity;
  if (isSeatingEvent) {
    if (designMode === 'custom' && customSeatingMap) {
      eventCapacity = customSeatingMap.sections.reduce((total, section) => total + (section.capacity || 0), 0);
    } else {
    eventCapacity = seatOptions.totalSeats;
    }
  } else {
    // General/Online: tổng số vé
    eventCapacity = ticketTypesData.reduce((sum, ticket) => sum + (ticket.quantity || ticket.totalQuantity || 0), 0);
  }

  // 1. Tạo sự kiện cơ bản
  const eventData = {
    title,
    description,
    images: images || {},
    startDate,
    endDate,
    organizers: [req.user._id], // Event owner là người tạo
    location: {
      type: location?.type || (isOnlineEvent ? 'online' : 'offline'),
      venueName: location?.venueName,
      address: location?.address,
      ward: location?.ward,
      district: location?.district,
      city: location?.city,
      country: location?.country || 'Vietnam',
      // Thêm thông tin cho online event
      meetingLink: location?.meetingLink,
      platform: location?.platform
    },
    category: category || [],
    tags: tags || [],
    capacity: eventCapacity,
    visibility: visibility || 'public',
    status: status || 'pending',
    detailedDescription: detailedDescription || { mainProgram: '', guests: '', specialExperiences: '' },
    termsAndConditions: termsAndConditions || '',
    organizer: { logo: '', name: req.user.fullName || req.user.username, info: '' },
    eventOrganizerDetails: { logo: '', name: req.user.fullName || req.user.username, info: '' },
    availableSeats: eventCapacity,
    seatingMap: isSeatingEvent ? {
      layoutType: seatOptions?.venueType || 'theater',
      sections: []
    } : null,
    ticketTypes: [],
    templateType: templateType || 'general' // Lưu template type
  };

  const event = new Event(eventData);
  
  // Debug mapping từ frontend data
  console.log('🎫 TicketTypes data received:');
  console.log('Raw ticketTypesData:', JSON.stringify(ticketTypesData, null, 2));
  console.log('Array length:', ticketTypesData.length);
  ticketTypesData.forEach((tt, index) => {
    console.log(`Ticket ${index}: {
  name: '${tt.name}',
  price: ${tt.price},
  quantity: ${tt.quantity},
  totalQuantity: ${tt.totalQuantity},
  description: '${tt.description}'
}`);
  });

  // 2. Tạo các loại vé với màu sắc và debug mapping
  const ticketTypesToCreate = ticketTypesData.map(tt => {
    const finalQuantity = tt.quantity || tt.totalQuantity;
    console.log(`🔍 Mapping ticket type: ${tt.name}`);
    console.log(`  - Original tt.quantity: ${tt.quantity} (${typeof tt.quantity})`);
    console.log(`  - Original tt.totalQuantity: ${tt.totalQuantity} (${typeof tt.totalQuantity})`);
    console.log(`  - Final quantity: ${finalQuantity} (${typeof finalQuantity})`);
    
    return {
      name: tt.name,
      price: tt.price,
      description: tt.description,
      quantity: finalQuantity,
      color: tt.color || getDefaultColorForTicketType(tt.name),
      event: event._id
    };
  });

  const createdTicketTypes = await Promise.all(
    ticketTypesToCreate.map(ttData => TicketType.create(ttData))
  );
  
  // Log created types để verify
  console.log('🎫 Creating tickets for ' + (isSeatingEvent ? 'seating' : isOnlineEvent ? 'online' : 'general') + '/online event');
  console.log('Created ticket types:', createdTicketTypes.map(tt => ({
    id: tt._id,
    name: tt.name,
    quantity: tt.quantity,
    price: tt.price
  })));

  const ticketTypeIds = createdTicketTypes.map(tt => tt._id);

  // 3. Tạo sơ đồ ghế chỉ cho sự kiện có ghế ngồi
  if (isSeatingEvent) {
    console.log('🎭 Generating seating map for seating event...');
    
    let seatingMap;
    if (designMode === 'custom' && customSeatingMap) {
      console.log('🎨 Using custom seating map');
      seatingMap = {
        ...customSeatingMap,
        layoutType: 'custom'
      };
      
      // Convert custom sections to proper format and generate seat details
      seatingMap.sections = customSeatingMap.sections.map(section => {
        const seatSpacing = 25;
        const rowSpacing = 30;
        const rowsPerSection = Math.max(1, Math.ceil(Math.sqrt(section.capacity || 50)));
        const seatsPerRow = Math.ceil((section.capacity || 50) / rowsPerSection);
        
        const rows = [];
        let seatNumber = 1;
        
        for (let j = 0; j < rowsPerSection && seatNumber <= (section.capacity || 50); j++) {
          const row = {
            name: `${section.name}${j + 1}`,
            seats: []
          };
          
          for (let k = 0; k < seatsPerRow && seatNumber <= (section.capacity || 50); k++) {
            row.seats.push({
              number: `${section.name}${j + 1}-${k + 1}`,
              status: 'available',
              x: (section.x || 0) + k * seatSpacing,
              y: (section.y || 0) + j * rowSpacing,
              _id: new (require('mongoose')).Types.ObjectId()
            });
            seatNumber++;
          }
          
          if (row.seats.length > 0) {
            rows.push(row);
          }
        }
        
        // Find matching ticket type
        const matchingTicketType = createdTicketTypes.find(tt => 
          tt.name === section.ticketType || tt.name.toLowerCase().includes(section.ticketType?.toLowerCase())
        ) || createdTicketTypes[0];
        
        return {
          name: section.name,
          ticketTier: matchingTicketType._id,
          capacity: section.capacity || 50,
          x: section.x || 0,
          y: section.y || 0,
          width: section.width || 150,
          height: section.height || 100,
          rows: rows
        };
      });
    } else {
      console.log('📋 Using template seating map');
      seatingMap = generateSeatingMap(seatOptions, createdTicketTypes);
    }
    
    console.log('🎭 Generated seating map:', seatingMap.sections.length, 'sections, layout:', seatingMap.layoutType);
    
    event.seatingMap = seatingMap;
    console.log('🎭 Set seatingMap on event object');
    
    // 4. Tạo tickets cho tất cả ghế
    await event.save();
    console.log('🎭 Event saved with seatingMap');
    
    const ticketsCreated = await generateTicketsFromSeatingMap(event._id, seatingMap, createdTicketTypes);
    console.log(`✅ Created ${ticketsCreated} tickets for seating event ${event.title}`);
  } else {
    // General/Online events: tạo tickets theo quantity
    await event.save();
    let totalTicketsCreated = 0;
    
    for (const ticketType of createdTicketTypes) {
      // Explicit conversion và validation
      let quantityToCreate = parseInt(ticketType.quantity);
      if (isNaN(quantityToCreate)) {
        // Fallback: try to get from original input data  
        const originalTT = ticketTypesToCreate.find(tt => tt.name === ticketType.name);
        quantityToCreate = parseInt(originalTT?.quantity);
      }
      
      console.log(`Processing ticket type: ${ticketType.name}, quantity: ${quantityToCreate} (type: ${typeof quantityToCreate})`);
      console.log(`  - ticketType.quantity: ${ticketType.quantity} (${typeof ticketType.quantity})`);
      console.log(`  - parsed quantity: ${quantityToCreate} (${typeof quantityToCreate})`);
      
      if (!quantityToCreate || quantityToCreate <= 0 || isNaN(quantityToCreate)) {
        console.log(`⚠️ Skipping ticket type ${ticketType.name} - invalid quantity: ${quantityToCreate}`);
        continue;
      }
      
      console.log(`Creating ${quantityToCreate} tickets for ${ticketType.name}`);
      const tickets = [];
      for (let i = 1; i <= quantityToCreate; i++) {
        tickets.push({
          event: event._id,
          ticketType: ticketType.name, // String thay vì ObjectId
          price: ticketType.price, // Sử dụng price thay vì originalPrice/finalPrice
          status: 'available',
          qrCode: `${event._id}-${ticketType.name}-${i}-${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
          seat: {
            seatNumber: isOnlineEvent ? `ONLINE-${i}` : `GENERAL-${i}`
          }
        });
      }
      
      if (tickets.length > 0) {
        await Ticket.insertMany(tickets);
        totalTicketsCreated += tickets.length;
        console.log(`✅ Created ${tickets.length} tickets for ${ticketType.name}`);
      }
    }
    
    console.log(`✅ Created ${totalTicketsCreated} tickets for ${templateType} event ${event.title}`);
  }

  event.ticketTypes = ticketTypeIds;
  await event.save();
  
  const populatedEvent = await Event.findById(event._id)
    .populate('organizers', 'username email fullName avatar')
    .populate('ticketTypes');

  // Debug: Verify seatingMap was saved
  console.log('🔍 Final verification - seatingMap sections:', populatedEvent.seatingMap?.sections?.length || 'null');
  if (populatedEvent.seatingMap && populatedEvent.seatingMap.sections) {
    console.log('✅ SeatingMap successfully saved with', populatedEvent.seatingMap.sections.length, 'sections');
  } else {
    console.log('❌ SeatingMap is null or empty after save!');
  }

  res.status(201).json({
    success: true,
    message: `Tạo sự kiện ${templateType} thành công!`,
    data: populatedEvent
  });
});

// Helper function để tính toán spacing responsive dựa trên số ghế
const calculateResponsiveSpacing = (totalSeats, totalSections) => {
  // Base spacing values - tăng CỰC LỚN để đảm bảo không chồng lên nhau
  const baseSeatSpacing = 40; // Tăng từ 30 lên 40
  const baseRowSpacing = 45; // Tăng từ 35 lên 45
  const baseSectionSpacing = 200; // Tăng từ 150 lên 200
  
  // Calculate seats per section to determine density
  const seatsPerSection = Math.floor(totalSeats / totalSections);
  
  // Adjust spacing based on density - TẤT CẢ ĐỀU TĂNG MẠNH
  let seatSpacing, rowSpacing, sectionSpacing;
  
  if (totalSeats <= 100) {
    // Ít ghế - spacing CỰC RỘNG
    seatSpacing = baseSeatSpacing * 2.5; // Tăng từ 2 lên 2.5
    rowSpacing = baseRowSpacing * 2.5;
    sectionSpacing = baseSectionSpacing * 3; // Tăng từ 2.5 lên 3
  } else if (totalSeats <= 300) {
    // Trung bình - spacing rất rộng
    seatSpacing = baseSeatSpacing * 2; // Tăng từ 1.5 lên 2
    rowSpacing = baseRowSpacing * 2;
    sectionSpacing = baseSectionSpacing * 2.5; // Tăng từ 1.8 lên 2.5
  } else if (totalSeats <= 500) {
    // Nhiều ghế - spacing rộng
    seatSpacing = baseSeatSpacing * 1.5; // Tăng từ 1 lên 1.5
    rowSpacing = baseRowSpacing * 1.5;
    sectionSpacing = baseSectionSpacing * 2; // Tăng từ 1.3 lên 2
  } else {
    // Rất nhiều ghế - spacing tối thiểu nhưng vẫn đủ rộng
    seatSpacing = baseSeatSpacing; // Giữ nguyên base
    rowSpacing = baseRowSpacing;
    sectionSpacing = baseSectionSpacing * 1.5; // Tăng từ 1 lên 1.5
  }
  
  return {
    seatSpacing: Math.round(seatSpacing),
    rowSpacing: Math.round(rowSpacing), 
    sectionSpacing: Math.round(sectionSpacing)
  };
};

// Function để tạo sơ đồ ghế tự động với layout thông minh
const generateSeatingMap = (seatOptions, ticketTypes) => {
  const { totalSeats, totalSections, venueType = 'theater' } = seatOptions;
  
  console.log(`\n🎭 === GENERATE SEATING MAP CALLED ===`);
  console.log(`🎭 venueType: ${venueType}`);
  console.log(`🎭 totalSeats: ${totalSeats}, totalSections: ${totalSections}`);
  
  // Thông tin sân khấu - repositioned for better spacing
  const stage = {
    x: 250,
    y: 20,  // Moved up to create more consistent spacing
    width: 300,
    height: 60,
    centerX: 400,
    centerY: 50,  // Adjusted center accordingly
    gradient: {
      start: '#4f46e5',
      end: '#1e40af'
    },
    lighting: [
      { x: 280, y: 10, radius: 3 },
      { x: 320, y: 10, radius: 3 },
      { x: 360, y: 10, radius: 3 },
      { x: 400, y: 10, radius: 3 },
      { x: 440, y: 10, radius: 3 },
      { x: 480, y: 10, radius: 3 },
      { x: 520, y: 10, radius: 3 }
    ]
  };

  // Tạo layout dựa trên venue type
  console.log(`🎭 Switching on venueType: ${venueType}`);
  switch (venueType) {
    case 'stadium':
      return generateStadiumLayout(totalSeats, totalSections, ticketTypes, stage);
    case 'concert':
      return generateConcertLayout(totalSeats, totalSections, ticketTypes, stage);
    case 'outdoor':
      return generateOutdoorLayout(totalSeats, totalSections, ticketTypes, stage);
    case 'footballStadium':
      console.log(`🎭 Matched footballStadium case - calling generateFootballStadiumLayout`);
      return generateFootballStadiumLayout(totalSeats, totalSections, ticketTypes, stage);
    case 'basketballArena':
      console.log(`🎭 Matched basketballArena case - calling generateBasketballArenaLayout`);
      return generateBasketballArenaLayout(totalSeats, totalSections, ticketTypes, stage);
    case 'theater':
    default:
      return generateTheaterLayout(totalSeats, totalSections, ticketTypes, stage);
  }
};

// Stadium Layout: Oval arrangement around central field
const generateStadiumLayout = (totalSeats, totalSections, ticketTypes, stage) => {
  const sections = [];
  const seatsPerSection = Math.floor(totalSeats / totalSections);
  
  // Get responsive spacing
  const spacing = calculateResponsiveSpacing(totalSeats, totalSections);
  const { seatSpacing, rowSpacing, sectionSpacing } = spacing;
  
  // Dynamic calculation for rows and seats per row
  const rowsPerSection = Math.ceil(Math.sqrt(seatsPerSection / 2)); // Giảm số hàng để mỗi hàng có nhiều ghế hơn
  const seatsPerRow = Math.ceil(seatsPerSection / rowsPerSection);
  
  console.log(`Stadium Layout: ${totalSeats} seats, ${totalSections} sections, ${seatsPerSection} seats/section`);
  console.log(`Responsive spacing: seat=${seatSpacing}, row=${rowSpacing}, section=${sectionSpacing}`);
  
  let sectionIndex = 0;
  
  // VIP/Front sections (30% of total sections) - positioned closer to stage/field
  const vipSections = Math.ceil(totalSections * 0.3);
  const vipTicketType = ticketTypes.find(tt => tt.name.toLowerCase().includes('vip')) || ticketTypes[0];
    
  // VIP sections in arc around front
  const vipRadius = 180;
  const vipAngleStep = Math.PI / (vipSections + 1);
    
    for (let i = 0; i < vipSections; i++) {
    const angle = vipAngleStep * (i + 1);
    const centerX = 400 + vipRadius * Math.cos(angle);
    const centerY = 200 + vipRadius * Math.sin(angle) * 0.5; // Flatten the arc
    
    const sectionName = String.fromCharCode(65 + sectionIndex++);
    sections.push(createSection(sectionName, vipTicketType._id, seatsPerSection, rowsPerSection, seatsPerRow, centerX - (seatsPerRow * seatSpacing) / 2, centerY, seatSpacing, rowSpacing));
  }
  
  // General sections (70% of sections) - positioned in outer ring
  const generalSections = totalSections - vipSections;
  const generalTicketType = ticketTypes.find(tt => tt.name.toLowerCase().includes('general') || tt.name.toLowerCase().includes('thường')) || ticketTypes[ticketTypes.length - 1];
  
  // Arrange general sections in larger arc
  const generalRadius = 320;
  const generalAngleStep = (Math.PI * 1.5) / generalSections; // Spread over larger arc
    
    for (let i = 0; i < generalSections; i++) {
    const angle = -Math.PI * 0.25 + generalAngleStep * i; // Start from left side
    const centerX = 400 + generalRadius * Math.cos(angle);
    const centerY = 300 + generalRadius * Math.sin(angle) * 0.3; // Flatten more
    
    const sectionName = String.fromCharCode(65 + sectionIndex++);
    sections.push(createSection(sectionName, generalTicketType._id, seatsPerSection, rowsPerSection, seatsPerRow, centerX - (seatsPerRow * seatSpacing) / 2, centerY, seatSpacing, rowSpacing));
  }
  
  // Debug logging
  console.log('=== STADIUM LAYOUT DEBUG ===');
  console.log(`Total sections: ${totalSections}, Seats per section: ${seatsPerSection}`);
  sections.forEach((section, index) => {
    if (section.rows && section.rows.length > 0) {
      const firstRow = section.rows[0];
      if (firstRow && firstRow.seats && firstRow.seats.length > 0) {
        const firstSeat = firstRow.seats[0];
        const lastSeat = firstRow.seats[firstRow.seats.length - 1];
        const sectionWidth = lastSeat && firstSeat ? (lastSeat.x - firstSeat.x + seatSpacing) : 0;
        const sectionHeight = section.rows.length * rowSpacing;
        console.log(`Section ${section.name}: X=${firstSeat?.x || 0}, Y=${firstSeat?.y || 0}, Width=${sectionWidth}, Height=${sectionHeight}`);
      }
    }
  });
  console.log('============================');

  return { 
    layoutType: 'stadium', 
    sections,
    stage: stage
  };
};

// Concert Layout: Layout thực tế như venue concert thật
const generateConcertLayout = (totalSeats, totalSections, ticketTypes, stage) => {
  const sections = [];
  const seatsPerSection = Math.floor(totalSeats / totalSections);
  
  // Spacing được tăng để tránh chồng chéo
  const seatSpacing = 35;
  const rowSpacing = 40;
  const sectionSpacing = 120; // Tăng từ 100 lên 120
  
  // Tạo layout hình chữ nhật cho mỗi section - ít hàng hơn để rộng hơn
  const rowsPerSection = Math.min(Math.ceil(Math.sqrt(seatsPerSection / 2)), 6); // Tối đa 6 hàng thay vì 8
  const seatsPerRow = Math.ceil(seatsPerSection / rowsPerSection);
  
  console.log(`🎵 Concert Layout: ${totalSeats} seats, ${totalSections} sections`);
  console.log(`📐 Section size: ${rowsPerSection} rows x ${seatsPerRow} seats`);
  console.log(`📏 Spacing: seat=${seatSpacing}, row=${rowSpacing}, section=${sectionSpacing}`);
  
  // Ticket types
  const goldenTicketType = ticketTypes.find(tt => tt.name.toLowerCase().includes('golden')) || ticketTypes[0];
  const vipTicketType = ticketTypes.find(tt => tt.name.toLowerCase().includes('vip')) || ticketTypes[0];
  const generalTicketType = ticketTypes.find(tt => tt.name.toLowerCase().includes('thường') || tt.name.toLowerCase().includes('general')) || ticketTypes[ticketTypes.length - 1];
  
  // Calculate section dimensions
  const sectionWidth = seatsPerRow * seatSpacing;
  const sectionHeight = rowsPerSection * rowSpacing;
  
  // **LAYOUT STRATEGY: Theo zones rõ ràng từ gần đến xa sân khấu**
  
  // Zone 1: GOLDEN CIRCLE (1 section ở giữa, gần nhất)
  if (totalSections >= 1) {
    const goldenX = 400 - (sectionWidth / 2); // Căn giữa hoàn hảo
    const goldenY = 150; // Cách stage nhiều hơn
    
    sections.push(createSection(
      'GOLDEN', 
      goldenTicketType._id, 
      seatsPerSection, 
      rowsPerSection, 
      seatsPerRow, 
      goldenX, 
      goldenY, 
      seatSpacing, 
      rowSpacing
    ));
  }
  
  // Zone 2: VIP SECTIONS (2-3 sections quanh Golden)
  if (totalSections >= 2) {
    const vipY = 150; // Cùng hàng với Golden
    
    if (totalSections === 2) {
      // Chỉ có 1 VIP bên cạnh Golden
      const vipX = 400 + sectionWidth/2 + sectionSpacing; // Bên phải Golden với khoảng cách an toàn
      sections.push(createSection('VIP-A', vipTicketType._id, seatsPerSection, rowsPerSection, seatsPerRow, vipX, vipY, seatSpacing, rowSpacing));
    } else if (totalSections >= 3) {
      // 2 VIP sections: trái và phải Golden với khoảng cách an toàn
      const leftVipX = 400 - sectionWidth/2 - sectionSpacing - sectionWidth;  // Bên trái
      const rightVipX = 400 + sectionWidth/2 + sectionSpacing; // Bên phải
      
      sections.push(createSection('VIP-A', vipTicketType._id, seatsPerSection, rowsPerSection, seatsPerRow, leftVipX, vipY, seatSpacing, rowSpacing));
      sections.push(createSection('VIP-B', vipTicketType._id, seatsPerSection, rowsPerSection, seatsPerRow, rightVipX, vipY, seatSpacing, rowSpacing));
     }
  }
  
  // Zone 3: GENERAL SECTIONS (còn lại xếp theo rows phía sau)
  const generalSections = Math.max(0, totalSections - 3); // Trừ đi Golden + 2 VIP
  
  if (generalSections > 0) {
    const generalStartY = 150 + sectionHeight + 120; // Cách zone VIP/Golden 120px
    
    // **SPECIAL LAYOUT FOR MANY SECTIONS**
    let sectionsPerRow;
    if (generalSections <= 3) {
      sectionsPerRow = generalSections; // 1 row
    } else if (generalSections <= 6) {
      sectionsPerRow = 3; // 2 rows max
    } else if (generalSections <= 9) {
      sectionsPerRow = 3; // 3 rows max
    } else {
      sectionsPerRow = 4; // 4 per row for large venues
    }
    
    const totalGeneralRows = Math.ceil(generalSections / sectionsPerRow);
    
    let generalIndex = 0;
    let sectionName = 'A'; // Bắt đầu từ A cho General
    
    for (let row = 0; row < totalGeneralRows; row++) {
      const sectionsInThisRow = Math.min(sectionsPerRow, generalSections - row * sectionsPerRow);
      
      // Căn giữa row này với khoảng cách tăng
      const totalRowWidth = sectionsInThisRow * sectionWidth + (sectionsInThisRow - 1) * sectionSpacing;
      const rowStartX = 400 - (totalRowWidth / 2);
      
      for (let col = 0; col < sectionsInThisRow; col++) {
        if (generalIndex >= generalSections) break;
        
        const sectionX = rowStartX + col * (sectionWidth + sectionSpacing);
        const sectionY = generalStartY + row * (sectionHeight + 120); // 120px giữa các hàng
       
        sections.push(createSection(
          sectionName, 
          generalTicketType._id, 
          seatsPerSection, 
          rowsPerSection, 
          seatsPerRow, 
          sectionX, 
          sectionY, 
          seatSpacing, 
          rowSpacing
        ));
        
        // Increment section name: A -> B -> C -> ...
        sectionName = String.fromCharCode(sectionName.charCodeAt(0) + 1);
        generalIndex++;
      }
    }
  }
  
  // Debug logging (safer version)
  console.log('=== CONCERT LAYOUT DEBUG ===');
  console.log(`Total sections: ${totalSections}, Seats per section: ${seatsPerSection}`);
  console.log(`Sections created: ${sections.length}`);
  sections.forEach((section, index) => {
    console.log(`Section ${section.name}: Created with ${section.rows?.length || 0} rows`);
  });
  console.log('============================');

  return { 
    layoutType: 'concert', 
    sections,
    stage: stage
  };
};

// Theater Layout: Traditional rows facing stage
const generateTheaterLayout = (totalSeats, totalSections, ticketTypes, stage) => {
  const sections = [];
  const seatsPerSection = Math.floor(totalSeats / totalSections);
  
  // Get responsive spacing
  const spacing = calculateResponsiveSpacing(totalSeats, totalSections);
  const { seatSpacing, rowSpacing, sectionSpacing } = spacing;
  
  const rowsPerSection = Math.ceil(Math.sqrt(seatsPerSection));
  const seatsPerRow = Math.ceil(seatsPerSection / rowsPerSection);
  
  console.log(`Theater Layout: ${totalSeats} seats, ${totalSections} sections, ${seatsPerSection} seats/section`);
  console.log(`Responsive spacing: seat=${seatSpacing}, row=${rowSpacing}, section=${sectionSpacing}`);
  
  // Tính số sections per row dựa trên tổng số sections và responsive spacing
  let sectionsPerRow;
  if (totalSections <= 4) {
    sectionsPerRow = totalSections;
  } else if (totalSections <= 9) {
    sectionsPerRow = Math.ceil(Math.sqrt(totalSections));
  } else {
    sectionsPerRow = Math.ceil(totalSections / 3); // Tối đa 3 hàng
  }
  
  // Tính toán kích thước một section
  const sectionWidth = seatsPerRow * seatSpacing;
  const sectionHeight = rowsPerSection * rowSpacing;
  
  // Tính toán vị trí bắt đầu để căn giữa
  const totalBlockWidth = (sectionsPerRow * sectionWidth) + ((sectionsPerRow - 1) * sectionSpacing);
  const startX = 400 - (totalBlockWidth / 2); // Căn giữa với sân khấu
  const startY = 150;
  
  for (let i = 0; i < totalSections; i++) {
    const sectionRowIndex = Math.floor(i / sectionsPerRow);
    const sectionColIndex = i % sectionsPerRow;
    
    // Tính vị trí x,y cho từng section
    const sectionX = startX + sectionColIndex * (sectionWidth + sectionSpacing);
    const sectionY = startY + sectionRowIndex * (sectionHeight + 50); // Tăng khoảng cách giữa các hàng từ 30 lên 50px
    const sectionName = String.fromCharCode(65 + i);
    
    // Assign ticket types: front sections get better tickets
    const isVIPSection = sectionRowIndex === 0; // First row is VIP
    const ticketTier = isVIPSection ? 
      (ticketTypes.find(tt => tt.name.toLowerCase().includes('vip')) || ticketTypes[0]) :
      (ticketTypes.find(tt => tt.name.toLowerCase().includes('thường')) || ticketTypes[ticketTypes.length - 1]);
    
    sections.push(createSection(sectionName, ticketTier._id, seatsPerSection, rowsPerSection, seatsPerRow, sectionX, sectionY, seatSpacing, rowSpacing));
  }
  
  return { 
    layoutType: 'theater', 
    sections,
    stage: stage
  };
};

// Outdoor Layout: Flexible zones
const generateOutdoorLayout = (totalSeats, totalSections, ticketTypes, stage) => {
  const sections = [];
  
  // Get responsive spacing
  const spacing = calculateResponsiveSpacing(totalSeats, totalSections);
  const { seatSpacing, rowSpacing, sectionSpacing } = spacing;
  
  console.log(`Outdoor Layout: ${totalSeats} seats, ${totalSections} sections`);
  console.log(`Responsive spacing: seat=${seatSpacing}, row=${rowSpacing}, section=${sectionSpacing}`);
  
  const vipSeats = Math.floor(totalSeats * 0.3); // 30% VIP front
  const generalSeats = totalSeats - vipSeats; // 70% General
  
  const vipSections = Math.ceil(totalSections * 0.4);
  const generalSections = totalSections - vipSections;
  
  let sectionIndex = 0;
  
  // VIP front area - dynamic positioning
  const vipSeatsPerSection = Math.floor(vipSeats / vipSections);
  const vipTicketType = ticketTypes.find(tt => tt.name.toLowerCase().includes('vip') || tt.name.toLowerCase().includes('front')) || ticketTypes[0];
  const vipRowsPerSection = Math.ceil(Math.sqrt(vipSeatsPerSection));
  const vipSeatsPerRow = Math.ceil(vipSeatsPerSection / vipRowsPerSection);
  const vipSectionWidth = vipSeatsPerRow * seatSpacing;
  
  // Tính toán để căn giữa VIP sections với spacing tốt hơn
  const totalVipWidth = vipSections * vipSectionWidth + (vipSections - 1) * 100; // Tăng spacing từ 60 lên 100
  const vipStartX = 400 - (totalVipWidth / 2);
  
  for (let i = 0; i < vipSections; i++) {
    const sectionName = String.fromCharCode(65 + sectionIndex++);
    const sectionX = vipStartX + i * (vipSectionWidth + 100); // Tăng spacing từ 60 lên 100
    const sectionY = 150;
    
    sections.push(createSection(sectionName, vipTicketType._id, vipSeatsPerSection, vipRowsPerSection, vipSeatsPerRow, sectionX, sectionY, seatSpacing, rowSpacing));
  }
  
  // General areas - dynamic grid
  const generalSeatsPerSection = Math.floor(generalSeats / generalSections);
  const generalTicketType = ticketTypes.find(tt => tt.name.toLowerCase().includes('general') || tt.name.toLowerCase().includes('thường')) || ticketTypes[ticketTypes.length - 1];
  const generalRowsPerSection = Math.ceil(Math.sqrt(generalSeatsPerSection));
  const generalSeatsPerRow = Math.ceil(generalSeatsPerSection / generalRowsPerSection);
  const generalSectionWidth = generalSeatsPerRow * seatSpacing;
  const generalSectionHeight = generalRowsPerSection * rowSpacing;
  
  // Tạo grid cho general sections với spacing tốt hơn
  const sectionsPerRow = Math.ceil(Math.sqrt(generalSections));
  const totalGeneralWidth = sectionsPerRow * generalSectionWidth + (sectionsPerRow - 1) * 120; // Tăng từ 80 lên 120
  const generalStartX = 400 - (totalGeneralWidth / 2);
  const generalStartY = 320; // Tăng khoảng cách từ VIP từ 280 lên 320
  
  for (let i = 0; i < generalSections; i++) {
    const sectionName = String.fromCharCode(65 + sectionIndex++);
    const rowIndex = Math.floor(i / sectionsPerRow);
    const colIndex = i % sectionsPerRow;
    
    const sectionX = generalStartX + colIndex * (generalSectionWidth + 120); // Tăng từ 80 lên 120
    const sectionY = generalStartY + rowIndex * (generalSectionHeight + 80); // Tăng từ 60 lên 80
    
    sections.push(createSection(sectionName, generalTicketType._id, generalSeatsPerSection, generalRowsPerSection, generalSeatsPerRow, sectionX, sectionY, seatSpacing, rowSpacing));
  }
  
  return { 
    layoutType: 'outdoor', 
    sections,
    stage: stage
  };
};

// Football Stadium Layout: 4-sided stadium with premium central sections
const generateFootballStadiumLayout = (totalSeats, totalSections, ticketTypes, stage) => {
  const sections = [];
  const seatsPerSection = Math.floor(totalSeats / totalSections);
  
  // Tighter spacing to prevent overlap
  const seatSpacing = 20;  // Giảm từ 30 xuống 20
  const rowSpacing = 25;   // Giảm từ 35 xuống 25
  const sectionSpacing = 150; // Tăng lên 150 để đảm bảo không chồng chéo
  
  // Smaller sections to fit better
  const rowsPerSection = Math.min(Math.ceil(Math.sqrt(seatsPerSection / 4)), 4); // Tối đa 4 hàng
  const seatsPerRow = Math.ceil(seatsPerSection / rowsPerSection);
  
  console.log(`\n⚽ === FOOTBALL STADIUM LAYOUT CALLED ===`);
  console.log(`⚽ Football Stadium Layout: ${totalSeats} seats, ${totalSections} sections`);
  console.log(`📐 Section size: ${rowsPerSection} rows x ${seatsPerRow} seats`);
  console.log(`📏 Spacing: seat=${seatSpacing}, row=${rowSpacing}, section=${sectionSpacing}`);
  
  // Get ticket types with fallbacks
  const vipBoxType = ticketTypes.find(tt => tt.name.toLowerCase().includes('vip box') || tt.name.toLowerCase().includes('box')) || ticketTypes[0];
  const premiumType = ticketTypes.find(tt => tt.name.toLowerCase().includes('premium')) || ticketTypes[0];
  const mainStandType = ticketTypes.find(tt => tt.name.toLowerCase().includes('chính') || tt.name.toLowerCase().includes('main')) || ticketTypes[1] || ticketTypes[0];
  const sideStandType = ticketTypes.find(tt => tt.name.toLowerCase().includes('góc') || tt.name.toLowerCase().includes('corner')) || ticketTypes[2] || ticketTypes[0];
  const endStandType = ticketTypes.find(tt => tt.name.toLowerCase().includes('foh') || tt.name.toLowerCase().includes('xa')) || ticketTypes[ticketTypes.length - 1];
  
  const sectionWidth = seatsPerRow * seatSpacing;
  const sectionHeight = rowsPerSection * rowSpacing;
  
  console.log(`📏 Calculated section dimensions: ${sectionWidth}x${sectionHeight}`);
  
  // Football field in center
  const fieldX = 400;  // Center X
  const fieldY = 300;  // Center Y  
  const fieldWidth = 200;
  const fieldHeight = 120;
  
  // **LAYOUT ĐƠN GIẢN THEO GRID SYSTEM - TRÁNH CHỒNG CHÉO**
  
  let sectionIndex = 0;
  const sectionNames = ['DB2', 'DB1', 'DC2', 'DC1', 'DA1', 'DA2', 'DA3', 'DA4', 'KD_A', 'KD_B', 'KD_C', 'FOH'];
  const sectionTypes = [vipBoxType, vipBoxType, vipBoxType, vipBoxType, 
                       premiumType, premiumType, mainStandType, mainStandType,
                       sideStandType, sideStandType, sideStandType, endStandType];
  
  // Grid layout: 4 hàng x 3 cột
  const gridCols = 3;
  const gridRows = 4;
  const startX = fieldX - (gridCols * sectionSpacing) / 2;
  const startY = fieldY - (gridRows * sectionSpacing) / 2;
  
  for (let row = 0; row < gridRows && sectionIndex < totalSections; row++) {
    for (let col = 0; col < gridCols && sectionIndex < totalSections; col++) {
      const x = startX + col * sectionSpacing;
      const y = startY + row * sectionSpacing;
      
      // Skip center positions to leave space for field
      if ((row === 1 || row === 2) && col === 1) {
        continue; // Skip center where field is
      }
      
      const sectionName = sectionNames[sectionIndex] || `S${sectionIndex + 1}`;
      const ticketType = sectionTypes[sectionIndex] || endStandType;
      
      sections.push(createSection(
        sectionName, 
        ticketType._id, 
        seatsPerSection, 
        rowsPerSection, 
        seatsPerRow, 
        x, 
        y, 
        seatSpacing, 
        rowSpacing
      ));
      
      console.log(`Section ${sectionName}: Position (${x}, ${y})`);
      sectionIndex++;
    }
  }
  
  // Add any remaining sections in a circle around the grid
  if (sectionIndex < totalSections) {
    const remainingSections = totalSections - sectionIndex;
    const radius = 350;
    const angleStep = (Math.PI * 2) / remainingSections;
    
    for (let i = 0; i < remainingSections; i++) {
      const angle = i * angleStep;
      const x = fieldX + fieldWidth/2 + radius * Math.cos(angle);
      const y = fieldY + fieldHeight/2 + radius * Math.sin(angle);
      
      const sectionName = `E${i + 1}`;
      sections.push(createSection(
        sectionName, 
        endStandType._id, 
        seatsPerSection, 
        rowsPerSection, 
        seatsPerRow, 
        x, 
        y, 
        seatSpacing, 
        rowSpacing
      ));
      
      console.log(`Section ${sectionName}: Position (${x}, ${y})`);
      sectionIndex++;
    }
  }
  
  // Update stage to represent football field with realistic proportions
  const footballField = {
    ...stage,
    x: fieldX,
    y: fieldY,
    width: fieldWidth,
    height: fieldHeight,
    centerX: fieldX + fieldWidth/2,
    centerY: fieldY + fieldHeight/2
  };
  
  console.log(`⚽ Created ${sections.length} sections for football stadium`);
  
  return { 
    layoutType: 'footballStadium', 
    sections,
    stage: footballField
  };
};

// Basketball Arena Layout: Intimate arena surrounding court
const generateBasketballArenaLayout = (totalSeats, totalSections, ticketTypes, stage) => {
  const sections = [];
  const seatsPerSection = Math.floor(totalSeats / totalSections);
  
  // Tight spacing for intimate arena feel
  const seatSpacing = 32;
  const rowSpacing = 36;
  const sectionSpacing = 80;
  
  const rowsPerSection = Math.ceil(Math.sqrt(seatsPerSection / 2.5)); // Wider sections for arena
  const seatsPerRow = Math.ceil(seatsPerSection / rowsPerSection);
  
  console.log(`🏀 Basketball Arena Layout: ${totalSeats} seats, ${totalSections} sections`);
  console.log(`📐 Section size: ${rowsPerSection} rows x ${seatsPerRow} seats`);
  console.log(`📏 Spacing: seat=${seatSpacing}, row=${rowSpacing}, section=${sectionSpacing}`);
  
  // Get ticket types with fallbacks
  const courtsideType = ticketTypes.find(tt => tt.name.toLowerCase().includes('courtside')) || ticketTypes[0];
  const lowerBowlType = ticketTypes.find(tt => tt.name.toLowerCase().includes('lower')) || ticketTypes[1] || ticketTypes[0];
  const clubLevelType = ticketTypes.find(tt => tt.name.toLowerCase().includes('club')) || ticketTypes[2] || ticketTypes[0];
  const upperBowlType = ticketTypes.find(tt => tt.name.toLowerCase().includes('upper')) || ticketTypes[ticketTypes.length - 1];
  
  const sectionWidth = seatsPerRow * seatSpacing;
  const sectionHeight = rowsPerSection * rowSpacing;
  
  // Basketball court in center
  const courtX = 350;
  const courtY = 300;
  const courtWidth = 100;
  const courtHeight = 60;
  
  let sectionIndex = 0;
  
  // Courtside sections (premium, closest to court)
  const courtsideSections = Math.max(1, Math.floor(totalSections * 0.1)); // 10% courtside
  const courtsideRadius = 90;
  const courtsideAngleStep = (Math.PI * 2) / Math.max(courtsideSections, 4);
  
  for (let i = 0; i < courtsideSections && sectionIndex < totalSections; i++) {
    const angle = i * courtsideAngleStep;
    const x = courtX + courtWidth/2 + courtsideRadius * Math.cos(angle) - sectionWidth/2;
    const y = courtY + courtHeight/2 + courtsideRadius * Math.sin(angle) - sectionHeight/2;
    sections.push(createSection(`COURT-${i+1}`, courtsideType._id, seatsPerSection, rowsPerSection, seatsPerRow, x, y, seatSpacing, rowSpacing));
    sectionIndex++;
  }
  
  // Lower Bowl (main seating around court)
  const lowerBowlSections = Math.max(1, Math.floor(totalSections * 0.3)); // 30% lower bowl
  const lowerRadius = 150;
  const lowerAngleStep = (Math.PI * 2) / Math.max(lowerBowlSections, 6);
  
  for (let i = 0; i < lowerBowlSections && sectionIndex < totalSections; i++) {
    const angle = i * lowerAngleStep;
    const x = courtX + courtWidth/2 + lowerRadius * Math.cos(angle) - sectionWidth/2;
    const y = courtY + courtHeight/2 + lowerRadius * Math.sin(angle) - sectionHeight/2;
    sections.push(createSection(`L-${String.fromCharCode(65 + i)}`, lowerBowlType._id, seatsPerSection, rowsPerSection, seatsPerRow, x, y, seatSpacing, rowSpacing));
    sectionIndex++;
  }
  
  // Club Level (elevated with amenities)
  const clubLevelSections = Math.max(1, Math.floor(totalSections * 0.25)); // 25% club level
  const clubRadius = 210;
  const clubAngleStep = (Math.PI * 2) / Math.max(clubLevelSections, 6);
  
  for (let i = 0; i < clubLevelSections && sectionIndex < totalSections; i++) {
    const angle = i * clubAngleStep;
    const x = courtX + courtWidth/2 + clubRadius * Math.cos(angle) - sectionWidth/2;
    const y = courtY + courtHeight/2 + clubRadius * Math.sin(angle) - sectionHeight/2;
    sections.push(createSection(`C-${String.fromCharCode(65 + i)}`, clubLevelType._id, seatsPerSection, rowsPerSection, seatsPerRow, x, y, seatSpacing, rowSpacing));
    sectionIndex++;
  }
  
  // Upper Bowl (highest tier, budget seating)
  const remainingSections = totalSections - sectionIndex;
  if (remainingSections > 0) {
    const upperRadius = 270;
    const upperAngleStep = (Math.PI * 2) / Math.max(remainingSections, 6);
    
    for (let i = 0; i < remainingSections; i++) {
      const angle = i * upperAngleStep;
      const x = courtX + courtWidth/2 + upperRadius * Math.cos(angle) - sectionWidth/2;
      const y = courtY + courtHeight/2 + upperRadius * Math.sin(angle) - sectionHeight/2;
      sections.push(createSection(`U-${String.fromCharCode(65 + i)}`, upperBowlType._id, seatsPerSection, rowsPerSection, seatsPerRow, x, y, seatSpacing, rowSpacing));
      sectionIndex++;
    }
  }
  
  // Update stage to represent basketball court
  const basketballCourt = {
    ...stage,
    x: courtX,
    y: courtY,
    width: courtWidth,
    height: courtHeight,
    centerX: courtX + courtWidth/2,
    centerY: courtY + courtHeight/2
  };
  
  return { 
    layoutType: 'basketballArena', 
    sections,
    stage: basketballCourt
  };
};

// Helper function to create a section
const createSection = (sectionName, ticketTier, totalSeats, rowsPerSection, seatsPerRow, sectionX, sectionY, seatSpacing, rowSpacing) => {
  const section = {
    name: sectionName,
    ticketTier: ticketTier,
    rows: []
  };
  
  let seatNumber = 1;
  
  for (let j = 0; j < rowsPerSection && seatNumber <= totalSeats; j++) {
    const row = {
      name: `${sectionName}${j + 1}`, // A1, A2, B1, B2...
      seats: []
    };
    
    for (let k = 0; k < seatsPerRow && seatNumber <= totalSeats; k++) {
      row.seats.push({
        number: `${sectionName}${j + 1}-${k + 1}`, // A1-1, A1-2...
        status: 'available',
        x: sectionX + k * seatSpacing,
        y: sectionY + j * rowSpacing,
        _id: new (require('mongoose')).Types.ObjectId()
      });
      seatNumber++;
    }
    
    if (row.seats.length > 0) {
      section.rows.push(row);
    }
  }
  
  return section;
};

// Get all events
const getEvents = asyncHandler(async (req, res) => {
  const { visibility, featured, special, trending, category, limit, sort } = req.query;
  
  console.log('🔍 getEvents called with query params:', req.query);
  
  // Build query object
  const query = {};
  
  // Filter by visibility
  if (visibility) {
    query.visibility = visibility;
  }
  
  // Filter by admin controllable features
  if (featured === 'true') {
    query.featured = true;
  }
  
  if (special === 'true') {
    query.special = true;
  }
  
  if (trending === 'true') {
    query.trending = true;
  }
  
  // Filter by category
  if (category && category !== 'all') {
    query.category = { $in: [category] };
  }
  
  // Only show approved events for public access
  query.status = 'approved';
  
  console.log('📝 MongoDB query object:', JSON.stringify(query, null, 2));
  
  // Build sort object
  let sortQuery = { createdAt: -1 }; // Default sort by newest
  
  if (featured === 'true') {
    sortQuery = { featuredOrder: 1, createdAt: -1 };
  } else if (special === 'true') {
    sortQuery = { specialOrder: 1, createdAt: -1 };
  } else if (trending === 'true') {
    sortQuery = { trendingOrder: 1, createdAt: -1 };
  } else if (sort === 'date_asc') {
    sortQuery = { startDate: 1 };
  } else if (sort === 'date_desc') {
    sortQuery = { startDate: -1 };
  } else if (sort === 'name_asc') {
    sortQuery = { title: 1 };
  } else if (sort === 'name_desc') {
    sortQuery = { title: -1 };
  }
  
  console.log('🔄 Sort query:', JSON.stringify(sortQuery, null, 2));
  
  let eventQuery = Event.find(query)
    .populate('organizers', 'username email fullName avatar')
    .populate('location.venue', 'name address')
    .populate('ticketTypes')
    .sort(sortQuery);
    
  // Apply limit if specified
  if (limit && !isNaN(parseInt(limit))) {
    eventQuery = eventQuery.limit(parseInt(limit));
    console.log('📏 Applied limit:', parseInt(limit));
  }
  
  const events = await eventQuery.lean();
  console.log('📊 Found events count:', events.length);
  
  if (events.length > 0) {
    console.log('📋 First event title:', events[0].title);
  }

  // Tính số vé đã bán cho mỗi event
  for (let event of events) {
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      for (let ticketType of event.ticketTypes) {
        // Đếm số vé đã bán từ Ticket collection
        const soldCount = await Ticket.countDocuments({
          event: event._id,
          ticketType: ticketType._id,
          status: { $in: ['purchased', 'used'] }
        });
        ticketType.sold = soldCount;
      }
    }
  }
    
  res.status(200).json({
    success: true,
    events: events,
    data: events
  });
});

// Get a single event by ID
const getEventById = asyncHandler(async (req, res) => {
  // ===== CRITICAL FIX: Validate eventId is not string "null" or "undefined" =====
  const eventId = req.params.id;
  if (eventId === "null" || eventId === "undefined" || !eventId) {
    console.error('Invalid eventId received in getEventById:', eventId, typeof eventId);
    res.status(400);
    throw new Error('ID sự kiện không hợp lệ');
  }

  const event = await Event.findById(eventId)
    .populate('organizers', 'username email fullName avatar')
    .populate('location.venue', 'name address')
    .populate('ticketTypes')
    .lean();
    
  if (!event) {
    res.status(404);
    throw new Error(`Không tìm thấy sự kiện với ID ${eventId}`);
  }

  // Tính số vé đã bán cho event này
  if (event.ticketTypes && event.ticketTypes.length > 0) {
    for (let ticketType of event.ticketTypes) {
      // Đếm số vé đã bán từ Ticket collection
      const soldCount = await Ticket.countDocuments({
        event: event._id,
        ticketType: ticketType._id,
        status: { $in: ['purchased', 'used'] }
      });
      ticketType.sold = soldCount;
    }
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
  event.eventOrganizerDetails = organizer !== undefined ? organizer : event.eventOrganizerDetails;
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
    event.location.venueLayout = location.venueLayout !== undefined ? location.venueLayout : event.location.venueLayout;

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
      event.location.venue = undefined;
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
    event.seatingMap = seatingMap;
  }

  const updatedEvent = await event.save();

  // Populate organizers and venue
  const populatedEvent = await Event.findById(updatedEvent._id)
    .populate('organizers', 'username email fullName avatar')
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

// *** HÀM MỚI: TẠO TICKETS TỪ SEATING MAP ***
const generateTicketsFromSeatingMap = async (eventId, seatingMap, ticketTypes) => {
  const tickets = [];
  let totalTicketsCreated = 0;
  
  // Tạo map từ ticketType ID sang price
  const ticketTypeMap = {};
  ticketTypes.forEach(tt => {
    ticketTypeMap[tt._id.toString()] = {
      name: tt.name,
      price: tt.price
    };
  });

  // Duyệt qua tất cả sections và seats để tạo tickets
  for (const section of seatingMap.sections) {
    for (const row of section.rows) {
      for (const seat of row.seats) {
        const ticketInfo = ticketTypeMap[section.ticketTier.toString()];
        
        if (ticketInfo) {
          tickets.push({
            event: eventId,
            user: null, // Chưa có người mua
            price: ticketInfo.price,
            status: 'available', // Thay vì 'active' là 'available'
            qrCode: `${eventId}-${section.name}-${seat.number}-${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
            bookingId: null, // Chưa có booking
            ticketType: ticketInfo.name,
            seat: {
              section: section.name,
              row: row.name,
              seatNumber: seat.number
            },
            isUsed: false
          });
          totalTicketsCreated++;
        }
      }
    }
  }

  // Batch insert để tối ưu performance
  if (tickets.length > 0) {
    await Ticket.insertMany(tickets);
  }

  return totalTicketsCreated;
};

// Get ticket statistics for an event
const getEventTicketStats = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const Ticket = require('../models/Ticket');
  
  const stats = await Ticket.aggregate([
    { $match: { event: new mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const totalTickets = await Ticket.countDocuments({ event: eventId });
  
  const formattedStats = {
    total: totalTickets,
    available: 0,
    active: 0,
    returned: 0
  };
  
  stats.forEach(stat => {
    formattedStats[stat._id] = stat.count;
  });
  
  res.json({
    success: true,
    data: formattedStats
  });
});

// Preview seating map endpoint
const previewSeatingMap = asyncHandler(async (req, res) => {
  const { seatOptions, ticketTypes } = req.body;

  // Validate input
  if (!seatOptions || !seatOptions.totalSeats || !seatOptions.totalSections) {
    res.status(400);
    throw new Error('seatOptions với totalSeats và totalSections là bắt buộc');
  }

  if (!ticketTypes || !Array.isArray(ticketTypes) || ticketTypes.length === 0) {
    res.status(400);
    throw new Error('ticketTypes là bắt buộc và phải là array');
  }

  try {
    // Generate seating map preview
    const seatingMap = generateSeatingMap(seatOptions, ticketTypes);
    
    console.log(`🎭 Generated seating preview: ${seatOptions.totalSeats} seats, ${seatOptions.totalSections} sections, layout: ${seatOptions.venueType}`);
    
    res.json({
      success: true,
      data: seatingMap
    });
  } catch (error) {
    console.error('Error generating seating preview:', error);
    res.status(500);
    throw new Error('Không thể tạo preview sơ đồ ghế: ' + error.message);
  }
});

module.exports = {
  createEvent,
  createEventWithSeating,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByOwnerId,
  getEventTicketStats,
  previewSeatingMap
};