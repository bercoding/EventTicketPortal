const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const Venue = require('../models/Venue');
const User = require('../models/User');
const TicketType = require('../models/TicketType');
const Ticket = require('../models/Ticket');
const mongoose = require('mongoose');

// Helper function to create a section with rows and seats
const createSection = (name, ticketTierId, totalSeats, numRows, seatsPerRow, x, y, seatSpacing, rowSpacing) => {
  // Create section object with provided properties
  const section = {
    name,
    x,
    y,
    width: seatsPerRow * seatSpacing,
    height: numRows * rowSpacing,
    ticketTier: ticketTierId,
    rows: []
  };
  
  // Generate rows and seats
  for (let i = 0; i < numRows; i++) {
    const rowName = String.fromCharCode(65 + i); // A, B, C...
    const seats = [];
    
    for (let j = 0; j < seatsPerRow; j++) {
      seats.push({
        number: `${j + 1}`,
        status: 'available',
        x: x + (j * seatSpacing),
        y: y + (i * rowSpacing)
      });
    }
    
    section.rows.push({
      name: rowName,
      seats
    });
  }
  
  return section;
};

// Lấy danh sách sự kiện
const getEvents = asyncHandler(async (req, res) => {
  const { 
    category, 
    search, 
    featured, 
    trending, 
    special, 
    upcoming,
    limit = 10,
    page = 1
  } = req.query;
  
  const query = { status: 'approved' }; // Chỉ lấy sự kiện đã được phê duyệt
  
  // Tìm kiếm theo category nếu có
  if (category) {
    query.category = { $in: Array.isArray(category) ? category : [category] };
  }
  
  // Tìm kiếm theo từ khóa
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  
  // Lọc theo featured/trending/special
  if (featured === 'true') query.featured = true;
  if (trending === 'true') query.trending = true;
  if (special === 'true') query.special = true;
  
  // Lọc sự kiện sắp diễn ra
  if (upcoming === 'true') {
    query.startDate = { $gte: new Date() };
  }
  
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'organizers', select: 'username fullName avatar' },
      { path: 'ticketTypes' }
    ]
  };
  
  try {
    const events = await Event.find(query)
      .populate('organizers', 'username fullName avatar')
      .populate('ticketTypes')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Event.countDocuments(query);
    
    res.json({
      success: true,
      count: events.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách sự kiện',
      error: error.message
    });
  }
});

// Lấy thông tin chi tiết của một sự kiện
const getEventById = asyncHandler(async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizers', 'username fullName avatar email')
      .populate('ticketTypes')
      .populate('location.venue');
      
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện'
      });
    }
    
    // Tăng lượt xem
    event.views += 1;
    await event.save();
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin sự kiện',
      error: error.message
    });
  }
});

// Tạo một sự kiện mới
const createEvent = asyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để tạo sự kiện'
      });
    }
    
    // Thêm organizer là người tạo sự kiện
    const eventData = {
      ...req.body,
      organizers: [req.user._id]
    };
    
    const createdEvent = await Event.create(eventData);
    
    // --- Ưu tiên ticketTypesData nếu có, fallback sang ticketTypes ---
    const ticketTypesInput = Array.isArray(req.body.ticketTypesData) && req.body.ticketTypesData.length > 0
      ? req.body.ticketTypesData
      : (Array.isArray(req.body.ticketTypes) ? req.body.ticketTypes : []);

    if (ticketTypesInput.length > 0) {
      const ticketTypeIds = [];
      for (const tt of ticketTypesInput) {
        const ticketType = await TicketType.create({
          name: tt.name,
          price: tt.price || 0,
          totalQuantity: tt.totalQuantity || 100,
          availableQuantity: tt.availableQuantity || tt.totalQuantity || 100,
          description: tt.description || '',
          color: tt.color || '#3B82F6',
          event: createdEvent._id
        });
        ticketTypeIds.push(ticketType._id);
      }
      createdEvent.ticketTypes = ticketTypeIds;
      await createdEvent.save();
    }
    // --- END ---
    
    // Trả về event đã được populate
    const populatedEvent = await Event.findById(createdEvent._id)
      .populate('organizers', 'username email fullName avatar')
      .populate('location.venue', 'name address')
      .populate('ticketTypes');
      
    res.status(201).json({
      success: true,
      message: 'Tạo sự kiện thành công!',
      data: populatedEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: `Không thể tạo sự kiện: ${error.message}`
    });
  }
});

// Cập nhật thông tin sự kiện
const updateEvent = asyncHandler(async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện'
      });
    }
    
    // Kiểm tra quyền - chỉ cho phép người tạo hoặc admin cập nhật
    if (
      req.user.role !== 'admin' &&
      !event.organizers.map(id => id.toString()).includes(req.user._id.toString())
    ) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền cập nhật sự kiện này'
      });
    }
    
    // Cập nhật thông tin
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('organizers', 'username email fullName avatar')
    .populate('ticketTypes');
    
    res.json({
      success: true,
      message: 'Cập nhật sự kiện thành công',
      data: updatedEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Không thể cập nhật sự kiện: ${error.message}`
    });
  }
});

// Xóa sự kiện
const deleteEvent = asyncHandler(async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện'
      });
    }
    
    // Cho phép admin hoặc organizer xoá sự kiện
    if (req.user.role !== 'admin' && !event.organizers.includes(req.user._id)) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền xoá sự kiện này'
      });
    }
    
    // Xóa tất cả ticket types liên quan
    await TicketType.deleteMany({ event: event._id });
    
    // Xóa sự kiện
    await event.remove();
    
    res.json({
      success: true,
      message: 'Xóa sự kiện thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Không thể xóa sự kiện: ${error.message}`
    });
  }
});

// Preview seating map - không yêu cầu đăng nhập
const previewSeatingMap = asyncHandler(async (req, res) => {
  try {
    const { layoutType, totalSeats, totalSections, venueType } = req.body;
    
    // Tạo một số loại vé mẫu nếu không có
    let ticketTypes = req.body.ticketTypes || [
      {
        name: 'Vé Thường',
        price: 0,
        totalQuantity: Math.floor(totalSeats * 0.7),
        availableQuantity: Math.floor(totalSeats * 0.7),
        description: 'Vé thường cho sự kiện',
        color: '#3B82F6',
        _id: new mongoose.Types.ObjectId()
      },
      {
        name: 'VIP',
        price: 0,
        totalQuantity: Math.floor(totalSeats * 0.3),
        availableQuantity: Math.floor(totalSeats * 0.3),
        description: 'Vé VIP',
        color: '#EF4444',
        _id: new mongoose.Types.ObjectId()
      }
    ];
    
    // Sử dụng helper function để tạo seating map
    const stage = {
      x: 250,
      y: 20,
      width: 300,
      height: 60,
      centerX: 400,
      centerY: 50,
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
    
    const seatOptions = {
      totalSeats: totalSeats || 100,
      totalSections: totalSections || 5,
      venueType: venueType || layoutType || 'theater'
    };
    
    // Tạo seatingMap sử dụng generateSeatingMap
    const seatingMap = generateSeatingMap(seatOptions, ticketTypes);
    
    res.json({
      success: true,
      data: seatingMap
    });
  } catch (error) {
    console.error('Error previewing seating map:', error);
    res.status(500).json({
      success: false,
      message: `Không thể tạo bản xem trước sơ đồ chỗ ngồi: ${error.message}`
    });
  }
});

// Cập nhật sơ đồ chỗ ngồi tạm thời
const updateSeatingMapTemp = asyncHandler(async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate event exists and user has permission
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện'
      });
    }

    // Check if user is organizer or admin
    if (req.user.role !== 'admin' && !event.organizers.some(org => org.toString() === req.user._id.toString())) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền cập nhật sự kiện này'
      });
    }

    console.log('🎭 Updating seating map for event:', eventId);

    // Generate a fixed layout for the event
    const fixedLayout = createFixedLayout();
    console.log(`🎭 Created fixed layout with ${fixedLayout.sections.length} sections`);

    // If there are ticket types, assign them to sections
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      for (const section of fixedLayout.sections) {
        section.ticketTier = event.ticketTypes[0]; // Assign first ticket type to all sections
      }
    }

    // Update the event with the new seating map
    event.seatingMap = fixedLayout;
    await event.save();

    res.json({
      success: true,
      message: 'Cập nhật sơ đồ chỗ ngồi thành công',
      data: event.seatingMap
    });
  } catch (error) {
    console.error('Error updating seating map:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật sơ đồ chỗ ngồi'
    });
  }
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

// Create event with seating
const createEventWithSeating = asyncHandler(async (req, res) => {
  console.log('🎭 createEventWithSeating called');
  try {
    // Kiểm tra xem người dùng đã đăng nhập
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Vui lòng đăng nhập để tạo sự kiện' 
      });
    }
    
    // Initialize ticketTypeIds at function scope to avoid undefined references
    let ticketTypeIds = [];
    
    console.log('Request body keys:', Object.keys(req.body));
    
    // Giới hạn kích thước và độ phức tạp của seatingMap
    let seatingMap = req.body.seatingMap;
    
    // Ensure seatingMap is an object
    if (typeof seatingMap === 'string') {
      try {
        seatingMap = JSON.parse(seatingMap);
        console.log('🎭 Parsed seatingMap from string');
      } catch (error) {
        console.error('❌ Error parsing seatingMap:', error);
        seatingMap = {};
      }
    }
    
    // Create a new object with the original data plus defaults for missing fields
    const processedSeatingMap = {
      ...(seatingMap || {}),  // Keep all original data
      layoutType: seatingMap?.layoutType || 'theater',
      sections: Array.isArray(seatingMap?.sections) ? [...seatingMap.sections] : [],
      stage: seatingMap?.stage || { x: 400, y: 50, width: 300, height: 60 },
      venueObjects: Array.isArray(seatingMap?.venueObjects) ? [...seatingMap.venueObjects] : []
    };
    
    // Use the processed seating map for further operations
    seatingMap = processedSeatingMap;
    
    // Log the seating map for debugging
    console.log(`🎭 Processed seating map: layoutType=${seatingMap.layoutType}, sections=${seatingMap.sections.length}, venueObjects=${seatingMap.venueObjects?.length || 0}`);
    
    // Xử lý và tối ưu hóa seatingMap để giảm kích thước
    if (seatingMap && seatingMap.sections && seatingMap.sections.length > 0) {
      // In thông tin seatingMap trước khi xử lý
      console.log(`🎭 Sections count: ${seatingMap.sections.length}`);
      
      // Giới hạn số lượng section
      if (seatingMap.sections.length > 20) {
        seatingMap.sections = seatingMap.sections.slice(0, 20);
      }
      
      // Process each section to ensure row data is properly structured
      seatingMap.sections = seatingMap.sections.map(section => {
        // Handle case where rows might be numeric
        if (typeof section.rows === 'number' || typeof section.rows === 'string') {
          const numRows = parseInt(section.rows) || 10;
          const seatsPerRow = parseInt(section.seatsPerRow) || 15;
          
          // Create proper row schema objects
          const rows = [];
          for (let i = 0; i < Math.min(numRows, 15); i++) {
            const rowName = String.fromCharCode(65 + i); // A, B, C...
            const seats = [];
            
            for (let j = 0; j < Math.min(seatsPerRow, 30); j++) {
              seats.push({
                number: `${j + 1}`,
                status: 'available',
                x: j * 20, 
                y: i * 20
              });
            }
            
            rows.push({
              name: rowName,
              seats: seats
            });
          }
          
          return {
            ...section,
            rows: rows
          };
        }
        
        // If section already has rows array, preserve it and just clean up the data
        if (Array.isArray(section.rows)) {
          // Process each row to ensure proper structure but preserve original data
          const processedRows = section.rows.map(row => {
            // If row is not an object or doesn't have seats, create minimal structure
            if (!row || typeof row !== 'object') {
              return { name: 'A', seats: [] };
            }
            
            // Preserve original row data
            const processedRow = { ...row };
            
            // Ensure seats is an array
            if (!Array.isArray(processedRow.seats)) {
              processedRow.seats = [];
            } else {
              // Process seats to fix any issues but preserve original data
              processedRow.seats = processedRow.seats.map(seat => {
                // If seat is not an object, create minimal structure
                if (!seat || typeof seat !== 'object') {
                  return { number: '1', status: 'available', x: 0, y: 0 };
                }
                
                // Create a new seat with all original properties except _id
                const { _id, ...seatWithoutId } = seat;
                
                // Return seat with defaults for missing required fields
                return {
                  ...seatWithoutId,
                  number: seat.number || '1',
                  status: seat.status || 'available',
                  x: typeof seat.x === 'number' ? seat.x : 0,
                  y: typeof seat.y === 'number' ? seat.y : 0
                };
              });
            }
            
            return processedRow;
          });
          
          return {
            ...section,
            rows: processedRows
          };
        }
        
        // If no valid rows structure, create empty rows array
        return {
          ...section,
          rows: []
        };
      });
    }
    
    // Make sure location.venueLayout matches seatingMap.layoutType
    if (!req.body.location) {
      req.body.location = {};
    }
    
    // Ensure venueLayout is valid and matches layoutType
    const layoutType = seatingMap?.layoutType || 'theater';
    req.body.location.venueLayout = layoutType;
    
    // Log important validation values to help debugging
    console.log(`🔍 Layout synchronization: seatingMap.layoutType=${layoutType}, location.venueLayout=${req.body.location.venueLayout}`);
    
    // Ensure capacity is set (required field)
    if (!req.body.capacity) {
      // Calculate capacity from seating map or set default
      let capacity = 100; // Default capacity
      if (seatingMap && seatingMap.sections) {
        capacity = seatingMap.sections.reduce((total, section) => {
          if (Array.isArray(section.rows)) {
            return total + section.rows.reduce((rowTotal, row) => {
              return rowTotal + (Array.isArray(row.seats) ? row.seats.length : 0);
            }, 0);
          }
          return total;
        }, 0);
      }
      req.body.capacity = capacity > 0 ? capacity : 100;
    }
    
    // IMPORTANT: Always preserve exact section positions from user's custom design
    if (seatingMap && Array.isArray(seatingMap.sections)) {
      // Verify and log each section's position to ensure they're being preserved
      seatingMap.sections.forEach((section, index) => {
        console.log(`📍 Preserving section ${index} position: (${section.x}, ${section.y}), dimensions: ${section.width}x${section.height}`);
        
        // Ensure section has valid coordinates - but do NOT modify them if they exist
        if (typeof section.x !== 'number' || typeof section.y !== 'number') {
          console.warn(`⚠️ Section ${index} has invalid coordinates, will use defaults`);
        }
      });
    }
    
    // Extract ticket types data from request body - look for ticketTypesData first, then fall back to ticketTypes
    let ticketTypesData = req.body.ticketTypesData || req.body.ticketTypes || [];
    
    console.log('Ticket types data source:', {
      hasTicketTypesData: !!req.body.ticketTypesData,
      hasTicketTypes: !!req.body.ticketTypes,
      ticketTypesDataType: typeof req.body.ticketTypesData,
      ticketTypesType: typeof req.body.ticketTypes
    });
    
    // Ensure ticketTypes is an array of plain objects, not a string
    if (typeof ticketTypesData === 'string') {
      try {
        console.log('Parsing ticket types from string:', ticketTypesData.substring(0, 100) + '...');
        ticketTypesData = JSON.parse(ticketTypesData);
      } catch (e) {
        console.error('Error parsing ticket types:', e);
        ticketTypesData = [];
      }
    }

    // Validate ticketTypesData is an array
    if (!Array.isArray(ticketTypesData)) {
      console.log('Converting non-array ticket types to array:', typeof ticketTypesData);
      ticketTypesData = [];
    }

    console.log(`🎫 Ticket types data (${typeof ticketTypesData}):`, ticketTypesData.length);

    // Tạo event với dữ liệu đã được tối ưu hóa
    const eventData = {
      ...req.body,
      organizers: [req.user._id],
      seatingMap: seatingMap, // Sử dụng seatingMap đã được tối ưu
      templateType: 'seating',
      // Remove ticketTypes from event creation as we'll create them separately
      ticketTypes: []
    };
    
    // Log the event data before creation
    console.log(`🎭 Creating event with seatingMap: sections=${eventData.seatingMap.sections.length}, venueObjects=${eventData.seatingMap.venueObjects?.length || 0}`);
    
    // Create event first without ticket types
    const createdEvent = await Event.create(eventData);
    
    // Ensure ticket types exist and create them if provided
    if (Array.isArray(ticketTypesData) && ticketTypesData.length > 0) {
      console.log('🎫 Creating ticket types:', ticketTypesData.length);
      
      // Use the outer ticketTypeIds variable instead of declaring a new one
      ticketTypeIds = [];
      for (const tt of ticketTypesData) {
        const ticketType = await TicketType.create({
          name: tt.name,
          price: tt.price || 0,
          description: tt.description || '',
          totalQuantity: tt.totalQuantity || 100,
          availableQuantity: tt.availableQuantity || tt.totalQuantity || 100,
          color: tt.color || '#3B82F6',
          event: createdEvent._id
        });
        ticketTypeIds.push(ticketType._id);
      }
      
      // Update event with ticket type IDs
      createdEvent.ticketTypes = ticketTypeIds;
      await createdEvent.save();
      
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
        // Only use fixed layout if ALL sections are invalid - this prioritizes keeping custom layouts
        const hasInvalidSections = createdEvent.seatingMap.sections.length === 0 || 
          createdEvent.seatingMap.sections.every(section => 
            typeof section.x !== 'number' || 
            typeof section.y !== 'number' ||
            typeof section.width !== 'number' || 
            typeof section.height !== 'number'
          );
        
        if (hasInvalidSections) {
          console.log("🎭 All sections have invalid coordinates, using fixed layout");
          useFixedLayout = true;
        } else {
          // Không kiểm tra rows và seats nữa, chỉ cần có sections với tọa độ hợp lệ
          // Bỏ qua kiểm tra seats, cho phép sections không có rows và seats
          console.log("🎭 Sections have valid coordinates, keeping custom layout");
        }
      }
      
      // Only use fixed layout if needed based on the checks above
      console.log("🎭 Respecting user's custom seating layout when possible");
      
      // Make sure useFixedLayout is defined
      useFixedLayout = typeof useFixedLayout !== 'undefined' ? useFixedLayout : false;
      
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
        // IMPORTANT: Check if ticketTypeIds is defined and not empty before using it
        const ticketIds = ticketTypeIds || [];
        if (ticketIds.length > 0 && fixedLayout.sections && fixedLayout.sections.length > 0) {
          // First section gets first ticket type (Vé Thường)
          fixedLayout.sections[0].ticketTier = ticketIds[0];
          
          // Second section gets second ticket type (Vé VIP) if available, otherwise first ticket type
          if (ticketIds.length > 1 && fixedLayout.sections.length > 1) {
            fixedLayout.sections[1].ticketTier = ticketIds[1];
          } else if (fixedLayout.sections.length > 1) {
            fixedLayout.sections[1].ticketTier = ticketIds[0];
          }
          
          console.log(`🎫 Assigned ticket types to sections: Section 1 -> ${ticketIds[0]}, Section 2 -> ${fixedLayout.sections.length > 1 ? (ticketIds.length > 1 ? ticketIds[1] : ticketIds[0]) : 'N/A'}`);
        }
        
        // Update the event with the new seating map
        createdEvent.seatingMap = fixedLayout;
        await createdEvent.save();
        console.log("✅ Fixed seating layout saved to event");
      } else {
        // CRITICAL: If we're using custom layout, absolutely preserve all positions exactly as designed
        console.log("🎭 Using custom layout - PRESERVING ALL POSITIONS");
        
        // Just assign ticket types if needed, but don't modify positions or layout
        // IMPORTANT: Check if ticketTypeIds is defined and not empty before using it
        const ticketIds = ticketTypeIds || [];
        if (ticketIds.length > 0) {
          createdEvent.seatingMap.sections.forEach((section, idx) => {
            // Only assign ticket tier if it doesn't already have one
            if (!section.ticketTier) {
              // Rotate through available ticket types
              const ticketTypeIdx = idx % ticketIds.length;
              section.ticketTier = ticketIds[ticketTypeIdx];
              console.log(`🎫 Assigned ticket type ${ticketIds[ticketTypeIdx]} to section "${section.name || idx}"`);
            }
          });
        }
        
        // Log all section positions to verify they're preserved
        createdEvent.seatingMap.sections.forEach((section, idx) => {
          console.log(`✓ Section ${idx} (${section.name}): position preserved at (${section.x}, ${section.y}), size: ${section.width}x${section.height}`);
        });
        
        await createdEvent.save();
        console.log("✅ Custom seating layout preserved with original positions");
      }
    }
    
    // If there's no seating map at all, create one using fixed layout
    if (!createdEvent.seatingMap || !createdEvent.seatingMap.sections || createdEvent.seatingMap.sections.length === 0) {
      console.log("🎭 No seating map found, creating a default layout");
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
      // IMPORTANT: Check if ticketTypeIds is defined and not empty before using it
      const ticketIds = ticketTypeIds || [];
      if (ticketIds.length > 0 && fixedLayout.sections && fixedLayout.sections.length > 0) {
        // First section gets first ticket type (Vé Thường)
        fixedLayout.sections[0].ticketTier = ticketIds[0];
        
        // Second section gets second ticket type (Vé VIP) if available, otherwise first ticket type
        if (ticketIds.length > 1 && fixedLayout.sections.length > 1) {
          fixedLayout.sections[1].ticketTier = ticketIds[1];
        } else if (fixedLayout.sections.length > 1) {
          fixedLayout.sections[1].ticketTier = ticketIds[0];
        }
        
        console.log(`🎫 Assigned ticket types to sections: Section 1 -> ${ticketIds[0]}, Section 2 -> ${fixedLayout.sections.length > 1 ? (ticketIds.length > 1 ? ticketIds[1] : ticketIds[0]) : 'N/A'}`);
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
      console.log("✅ Default seating layout created and saved to event");
    }

    // Always ensure we preserve original stage and venue objects exactly as provided
    if (seatingMap && seatingMap.stage && createdEvent.seatingMap) {
      createdEvent.seatingMap.stage = JSON.parse(JSON.stringify(seatingMap.stage));
      console.log("✅ Preserved original stage position");
      createdEvent.markModified('seatingMap.stage');
    }
    
    if (seatingMap && Array.isArray(seatingMap.venueObjects) && createdEvent.seatingMap) {
      createdEvent.seatingMap.venueObjects = JSON.parse(JSON.stringify(seatingMap.venueObjects));
      console.log(`✅ Preserved ${seatingMap.venueObjects.length} original venue objects`);
      createdEvent.markModified('seatingMap.venueObjects');
    }
    
    // Make sure layoutType is preserved
    if (seatingMap && seatingMap.layoutType && createdEvent.seatingMap) {
      createdEvent.seatingMap.layoutType = seatingMap.layoutType;
      console.log(`✅ Preserved original layout type: ${seatingMap.layoutType}`);
      createdEvent.markModified('seatingMap.layoutType');
    }
    
    // Final confirmation of the seating map structure
    if (createdEvent.seatingMap) {
      console.log(`🎭 Final seating map before save: layoutType=${createdEvent.seatingMap.layoutType}, sections=${createdEvent.seatingMap.sections?.length || 0}, venueObjects=${createdEvent.seatingMap.venueObjects?.length || 0}`);
      
      // Mark the entire seatingMap as modified to ensure all changes are saved
      createdEvent.markModified('seatingMap');
      
      // Save one final time
      await createdEvent.save();
      
      console.log(`✅ Created ${Array.isArray(ticketTypeIds) ? ticketTypeIds.length : 0} ticket types for event`);
      console.log(`✅ Final seating map has ${createdEvent.seatingMap.sections?.length || 0} sections, ${createdEvent.seatingMap.venueObjects?.length || 0} venue objects`);
      if (createdEvent.seatingMap.stage) {
        console.log(`✅ Final stage position: (${createdEvent.seatingMap.stage.x}, ${createdEvent.seatingMap.stage.y})`);
      }
    }
    
    // Populate organizers and venue
    const populatedEvent = await Event.findById(createdEvent._id)
      .populate('organizers', 'username email fullName avatar')
      .populate('location.venue', 'name address')
      .populate('ticketTypes')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Tạo sự kiện thành công!',
      data: populatedEvent
    });
  } catch (error) {
    console.error('Error creating event with seating:', error);
    return res.status(500).json({ 
      success: false,
      message: `Không thể tạo sự kiện với tùy chọn ghế: ${error.message}`
    });
  }
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

  // Tạo các vật thể phụ trợ mặc định cho venue
  const defaultVenueObjects = [
    { type: 'entrance', label: 'Lối vào', x: 100, y: 500, width: 60, height: 30 },
    { type: 'exit', label: 'Lối ra', x: 700, y: 500, width: 60, height: 30 },
    { type: 'wc', label: 'WC', x: 100, y: 400, width: 40, height: 40 },
    { type: 'food', label: 'Thức ăn', x: 700, y: 400, width: 40, height: 40 }
  ];

  // Tạo layout dựa trên venue type
  console.log(`🎭 Switching on venueType: ${venueType}`);
  let seatingMap;
  
  // Make sure a valid layoutType is used
  let layoutType = 'theater';
  
  switch (venueType.toLowerCase()) {
    case 'stadium':
      layoutType = 'stadium';
      seatingMap = generateStadiumLayout(totalSeats, totalSections, ticketTypes, stage);
      break;
    case 'concert':
      layoutType = 'concert';
      seatingMap = generateConcertLayout(totalSeats, totalSections, ticketTypes, stage);
      break;
    case 'theater':
      layoutType = 'theater';
      seatingMap = generateTheaterLayout(totalSeats, totalSections, ticketTypes, stage);
      break;
    case 'outdoor':
      layoutType = 'outdoor';
      seatingMap = generateOutdoorLayout(totalSeats, totalSections, ticketTypes, stage);
      break;
    case 'footballstadium':
      layoutType = 'footballStadium';
      seatingMap = generateFootballStadiumLayout(totalSeats, totalSections, ticketTypes, stage);
      break;
    case 'basketballarena':
      layoutType = 'basketballArena';
      seatingMap = generateBasketballArenaLayout(totalSeats, totalSections, ticketTypes, stage);
      break;
    default:
      console.log('🎭 Using default theater layout');
      layoutType = 'theater';
      seatingMap = generateTheaterLayout(totalSeats, totalSections, ticketTypes, stage);
  }
  
  // Always ensure layoutType is set in the return object
  return {
    ...seatingMap,
    layoutType: layoutType,
    stage: seatingMap.stage || stage,
    venueObjects: seatingMap.venueObjects || defaultVenueObjects
  };
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
  
  console.log(`🏀 === BASKETBALL ARENA LAYOUT CALLED ===`);
  console.log(`🏀 Basketball Arena Layout: ${totalSeats} seats, ${totalSections} sections`);
  console.log(`📐 Section size: ${rowsPerSection} rows x ${seatsPerRow} seats`);
  
  // Find ticket types for different section tiers
  const vipType = ticketTypes.find(t => t.name.toLowerCase().includes('vip')) || ticketTypes[0];
  const courtSideType = ticketTypes.find(t => t.name.toLowerCase().includes('courtside') || t.name.toLowerCase().includes('premium')) || vipType;
  const lowerType = ticketTypes.find(t => t.name.toLowerCase().includes('lower') || t.name.toLowerCase().includes('main')) || ticketTypes[1] || vipType;
  const upperType = ticketTypes.find(t => t.name.toLowerCase().includes('upper') || t.name.toLowerCase().includes('balcony')) || ticketTypes[2] || ticketTypes[0];
  
  // Create basketball court dimensions
  const courtX = 400 - 75; // Center X - half width
  const courtY = 300 - 40; // Center Y - half height
  const courtWidth = 150;
  const courtHeight = 80;
  
  // Create sections around the court - lower tier first (closer to court)
  const sectionTypes = [courtSideType, courtSideType, courtSideType, courtSideType, 
                        lowerType, lowerType, lowerType, lowerType,
                        upperType, upperType, upperType, upperType];
  
  // Create sections in tiers around the court
  const centerX = courtX + courtWidth/2;
  const centerY = courtY + courtHeight/2;
  let sectionIndex = 0;
  
  // First tier - courtside (small sections very close to court)
  if (sectionIndex < totalSections) {
    const radius = courtHeight + 20; // Very close to court
    const sectionsInTier = Math.min(4, totalSections - sectionIndex);
    const angleStep = (Math.PI * 2) / sectionsInTier;
    
    for (let i = 0; i < sectionsInTier; i++) {
      const angle = i * angleStep;
      const x = centerX + radius * Math.cos(angle) - (seatsPerRow * seatSpacing) / 2;
      const y = centerY + radius * Math.sin(angle) - (rowsPerSection * rowSpacing) / 2;
      
      const sectionName = `CS${i + 1}`; // CS = Courtside
      const section = createSection(
        sectionName, 
        courtSideType._id, 
        Math.floor(seatsPerSection * 0.8), // Courtside sections are smaller
        Math.max(2, Math.floor(rowsPerSection * 0.5)), // Fewer rows
        Math.ceil(seatsPerRow * 1.2), // More seats per row for premium experience
        x, 
        y, 
        seatSpacing, 
        rowSpacing
      );
      sections.push(section);
      console.log(`Section ${sectionName}: Position (${x}, ${y})`);
      sectionIndex++;
    }
  }
  
  // Second tier - lower bowl (main sections)
  if (sectionIndex < totalSections) {
    const radius = courtHeight + 100; // Farther from court
    const remainingSections = Math.min(Math.floor(totalSections * 0.5), totalSections - sectionIndex);
    const angleStep = (Math.PI * 2) / remainingSections;
    
    for (let i = 0; i < remainingSections; i++) {
      const angle = i * angleStep;
      const x = centerX + radius * Math.cos(angle) - (seatsPerRow * seatSpacing) / 2;
      const y = centerY + radius * Math.sin(angle) - (rowsPerSection * rowSpacing) / 2;
      
      const sectionName = `L${i + 1}`; // L = Lower
      const section = createSection(
        sectionName, 
        lowerType._id, 
        seatsPerSection,
        rowsPerSection,
        seatsPerRow,
        x, 
        y, 
        seatSpacing, 
        rowSpacing
      );
      sections.push(section);
      console.log(`Section ${sectionName}: Position (${x}, ${y})`);
      sectionIndex++;
    }
  }
  
  // Third tier - upper bowl (remaining sections)
  if (sectionIndex < totalSections) {
    const radius = courtHeight + 200; // Much farther from court
    const remainingSections = totalSections - sectionIndex;
    const angleStep = (Math.PI * 2) / remainingSections;
    
    for (let i = 0; i < remainingSections; i++) {
      const angle = i * angleStep;
      const x = centerX + radius * Math.cos(angle) - (seatsPerRow * seatSpacing) / 2;
      const y = centerY + radius * Math.sin(angle) - (rowsPerSection * rowSpacing) / 2;
      
      const sectionName = `U${i + 1}`; // U = Upper
      const section = createSection(
        sectionName, 
        upperType._id, 
        seatsPerSection,
        Math.ceil(rowsPerSection * 1.2), // More rows in upper sections
        seatsPerRow,
        x, 
        y, 
        seatSpacing, 
        rowSpacing
      );
      sections.push(section);
      console.log(`Section ${sectionName}: Position (${x}, ${y})`);
      sectionIndex++;
    }
  }
  
  console.log(`🏀 Created ${sections.length} sections for basketball arena`);
  
  // Update stage to represent basketball court
  const basketballCourt = {
    ...stage,
    x: courtX,
    y: courtY,
    width: courtWidth,
    height: courtHeight,
    centerX: centerX,
    centerY: centerY
  };
  
  return { 
    layoutType: 'basketballArena', 
    sections,
    stage: basketballCourt
  };
};

// Get event ticket stats for dashboard
const getEventTicketStats = asyncHandler(async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện'
      });
    }
    
    // Get all tickets for this event
    const tickets = await Ticket.find({ event: eventId });
    
    // Get ticket types for this event
    const ticketTypes = await TicketType.find({ event: eventId });
    
    // Calculate stats
    const stats = {
      totalTickets: tickets.length,
      soldTickets: tickets.filter(ticket => ticket.status === 'sold').length,
      reservedTickets: tickets.filter(ticket => ticket.status === 'reserved').length,
      availableTickets: tickets.filter(ticket => ticket.status === 'available').length,
      ticketTypeStats: []
    };
    
    // Calculate stats per ticket type
    for (const type of ticketTypes) {
      const typeTickets = tickets.filter(ticket => ticket.ticketType.toString() === type._id.toString());
      stats.ticketTypeStats.push({
        typeId: type._id,
        typeName: type.name,
        typeColor: type.color,
        total: typeTickets.length,
        sold: typeTickets.filter(ticket => ticket.status === 'sold').length,
        reserved: typeTickets.filter(ticket => ticket.status === 'reserved').length,
        available: typeTickets.filter(ticket => ticket.status === 'available').length,
      });
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting event ticket stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê vé'
    });
  }
});

// Helper function to generate seating layouts
const createFixedLayout = () => {
  // Create two fixed sections with predefined coordinates - with more spacing between them
  const sections = [
    {
      name: "Khu 1 (Vé Thường)",
      x: 100,  // Moved further left
      y: 250,  // Moved up slightly
      width: 350,
      height: 200,
      rows: []
    },
    {
      name: "Khu 2 (Vé VIP)", 
      x: 650,  // Increased distance from first section
      y: 250,  // Aligned with first section
      width: 350,
      height: 200,
      rows: []
    }
  ];

  // Generate 5 rows per section with 10 seats each
  sections.forEach((section, sectionIndex) => {
    for (let r = 0; r < 5; r++) {
      const rowName = String.fromCharCode(65 + r); // A, B, C, etc.
      const rowY = section.y + 40 + (r * 35); // Increased spacing between rows
      
      const seats = [];
      for (let s = 0; s < 10; s++) {
        seats.push({
          // Remove the _id field - let MongoDB generate it
          number: s + 1,
          status: 'available',
          // Place seats evenly within the section width with more space
          x: section.x + 30 + (s * 30), // Increased spacing between seats
          y: rowY
        });
      }
      
      section.rows.push({
        name: rowName,
        seats: seats
      });
    }
  });

  // Define venue objects like entrances, exits, and facilities
  const venueObjects = [
    { 
      type: 'entrance',
      label: 'LỐI VÀO',
      x: 100,
      y: 550,
      width: 100,
      height: 40
    },
    { 
      type: 'exit',
      label: 'LỐI RA',
      x: 800,
      y: 550,
      width: 100,
      height: 40
    },
    { 
      type: 'wc',
      label: 'WC',
      x: 100, 
      y: 620,
      width: 80,
      height: 40
    },
    { 
      type: 'wc',
      label: 'WC',
      x: 820,
      y: 620,
      width: 80,
      height: 40
    },
    { 
      type: 'food',
      label: 'ĐỒ ĂN',
      x: 250,
      y: 620,
      width: 80,
      height: 40
    },
    { 
      type: 'drinks',
      label: 'NƯỚC',
      x: 650,
      y: 620,
      width: 80,
      height: 40
    }
  ];

  return {
    layoutType: 'theater', // Add the required layoutType field
    sections,
    stage: { x: 400, y: 80, width: 400, height: 100 },
    venueObjects: venueObjects
  };
};

// Export all controller functions
module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  updateSeatingMapTemp,
  createEventWithSeating,
  previewSeatingMap,
  getEventTicketStats
};