const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const TicketType = require('../models/TicketType');
const { uploadEventImages } = require('../middleware/uploadMiddleware');

const {
  createEvent,
  createEventWithSeating,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventTicketStats,
  previewSeatingMap
} = require('../controllers/eventController');
const { protect, requireAdmin: admin } = require('../middleware/auth');


// --- LOGIC TẠM THỜI ĐƯỢC CHUYỂN VÀO ĐÂY ---
const updateSeatingMapTemp = asyncHandler(async (req, res) => {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
        res.status(404);
        throw new Error('Không tìm thấy sự kiện.');
    }
    
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Không có quyền thực hiện hành động này.');
    }
    
    const ticketTypes = await TicketType.find({ event: event._id });
    if (ticketTypes.length === 0) {
        res.status(400);
        throw new Error("Sự kiện này chưa có loại vé nào.");
    }

    const generateSeatingMap = (ticketTiers) => {
        const sections = [];
        const seatsPerSection = 20;
        const rowsPerSection = 4;
        const seatsPerRow = 5;
        const seatSpacing = 20;
        const rowSpacing = 20;
        const sectionSpacing = 30;
        const totalSections = 6;
        const sectionsPerRow = 3;
        
        const totalBlockWidth = (sectionsPerRow * (seatsPerRow * seatSpacing)) + ((sectionsPerRow - 1) * sectionSpacing);
        const startX = 400 - (totalBlockWidth / 2);
        const startY = 150;
        
        // Thông tin sân khấu được cải thiện
        const stage = {
            x: 250,
            y: 30,
            width: 300,
            height: 60,
            centerX: 400,
            centerY: 60,
            gradient: {
                start: '#4f46e5', // Màu tím đậm
                end: '#1e40af'     // Màu xanh đậm
            },
            lighting: [
                { x: 280, y: 20, radius: 3 },
                { x: 320, y: 20, radius: 3 },
                { x: 360, y: 20, radius: 3 },
                { x: 400, y: 20, radius: 3 },
                { x: 440, y: 20, radius: 3 },
                { x: 480, y: 20, radius: 3 },
                { x: 520, y: 20, radius: 3 }
            ]
        };
        
        for (let i = 0; i < totalSections; i++) {
            const sectionRowIndex = Math.floor(i / sectionsPerRow);
            const sectionColIndex = i % sectionsPerRow;
            const sectionX = startX + sectionColIndex * (seatsPerRow * seatSpacing + sectionSpacing);
            const sectionY = startY + sectionRowIndex * (rowsPerSection * rowSpacing + rowSpacing + 20);
            const sectionName = String.fromCharCode(65 + i);
            const ticketTier = ticketTiers[i % ticketTiers.length]._id;
            
            const section = {
                name: sectionName,
                ticketTier: ticketTier,
                rows: [],
                labelPosition: {
                    x: sectionX + ((seatsPerRow - 1) * seatSpacing) / 2,
                    y: sectionY - 15
                }
            };
            
            for (let j = 0; j < rowsPerSection; j++) {
                const row = {
                    name: `${sectionName}${j + 1}`,
                    seats: []
                };
                
                for (let k = 0; k < seatsPerRow; k++) {
                    row.seats.push({
                        number: `${row.name}-${k + 1}`,
                        status: 'available',
                        x: sectionX + k * seatSpacing,
                        y: sectionY + j * rowSpacing
                    });
                }
                
                section.rows.push(row);
            }
            
            sections.push(section);
        }
        
        return { 
            layoutType: 'theater', 
            sections,
            stage: stage  // Thêm thông tin sân khấu vào seating map
        };
    };

    const newSeatingMap = generateSeatingMap(ticketTypes);
    event.seatingMap = newSeatingMap;
    const updatedEvent = await event.save();
    
    const populatedEvent = await Event.findById(updatedEvent._id)
        .populate('organizer', 'username fullName avatar')
        .populate('ticketTypes')
        .lean();
        
    res.status(200).json({
        success: true,
        message: 'Cập nhật sơ đồ ghế thành công!',
        data: populatedEvent
    });
});
// --- KẾT THÚC LOGIC TẠM THỜI ---


// Routes - Specific routes FIRST, then parametric routes
router.route('/').get(getEvents).post(protect, createEvent);
router.route('/create-with-seating').post(protect, createEventWithSeating); // Route cho event owners
router.route('/preview-seating').post(previewSeatingMap); // Route preview seating map - no auth needed

// My events route for event owners
router.get('/my-events', protect, asyncHandler(async (req, res) => {
    try {
        const events = await Event.find({ 
            $or: [
                { organizers: { $in: [req.user._id] } },
                { 'organizer.organizerId': req.user._id }
            ]
        })
        .populate('organizers', 'username email fullName avatar')
        .populate('ticketTypes')
        .sort({ createdAt: -1 });
        
        // Return direct array (không wrap trong object) để frontend nhận được
        res.json(events);
    } catch (error) {
        console.error('Error fetching my events:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách sự kiện' });
    }
}));

// Test route first
router.get('/test-upload', (req, res) => {
    res.json({ success: true, message: 'Upload route works!' });
});

// Upload images route - BEFORE /:id route
router.post('/upload-images', protect, uploadEventImages.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'organizer_logo', maxCount: 1 }
]), asyncHandler(async (req, res) => {
    const files = req.files || {};
    const uploadedFiles = {};
    
    if (files.logo && files.logo.length > 0) {
        uploadedFiles.logo = `/uploads/events/${files.logo[0].filename}`;
    }
    if (files.banner && files.banner.length > 0) {
        uploadedFiles.banner = `/uploads/events/${files.banner[0].filename}`;
    }
    if (files.organizer_logo && files.organizer_logo.length > 0) {
        uploadedFiles.organizer_logo = `/uploads/events/${files.organizer_logo[0].filename}`;
    }
    
    res.status(200).json({
        success: true,
        message: 'Upload thành công!',
        data: uploadedFiles
    });
}));

// Parametric routes LAST
router.route('/:id').get(getEventById).put(protect, admin, updateEvent).delete(protect, admin, deleteEvent);
router.route('/:id/update-seating-map').post(protect, admin, updateSeatingMapTemp); // Sử dụng hàm tạm thời
router.route('/:eventId/ticket-stats').get(protect, getEventTicketStats); // Route để xem thống kê vé

// Admin route for updating featured/special/trending status
router.put('/:id/admin-update', protect, admin, asyncHandler(async (req, res) => {
    try {
        const eventId = req.params.id;
        const updateData = req.body;
        
        // Validate the event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sự kiện'
            });
        }
        
        // Update the event with new data
        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            updateData,
            { new: true, runValidators: true }
        ).populate('organizer', 'username fullName avatar email')
         .populate('ticketTypes');
        
        res.json({
            success: true,
            message: 'Cập nhật sự kiện thành công',
            event: updatedEvent
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật sự kiện'
        });
    }
}));

// Mount nested review routes for events
router.use('/:eventId/reviews', require('../routes/review'));

module.exports = router; 