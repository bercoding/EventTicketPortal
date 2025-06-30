const mongoose = require('mongoose');
const Event = require('./models/Event');
const TicketType = require('./models/TicketType');
const User = require('./models/User');
const connectDB = require('./config/db');

const createSimpleEvent = async () => {
    await connectDB();
    
    try {
        // Tìm user admin hoặc owner để làm organizer
        const organizer = await User.findOne({ role: { $in: ['admin', 'owner'] } });
        if (!organizer) {
            console.log('❌ Không tìm thấy user admin/owner');
            return;
        }

        // 1. Tạo sự kiện đơn giản (không có seatingMap)
        const eventData = {
            title: 'Workshop Digital Marketing - Sự kiện test đơn giản',
            description: '<p>Workshop về Digital Marketing dành cho người mới bắt đầu. Không có ghế ngồi cố định.</p>',
            images: {
                banner: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=400&fit=crop',
                logo: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop'
            },
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày sau
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 giờ
            organizers: [organizer._id],
            location: {
                type: 'offline',
                venueName: 'Trung tâm Hội nghị ABC',
                address: '123 Nguyễn Văn Linh',
                ward: 'Phường 1',
                district: 'Quận 7',
                city: 'TP.HCM',
                country: 'Vietnam',
                venueLayout: 'conference' // Không phải outdoor
            },
            category: ['workshop', 'marketing'],
            tags: ['digital-marketing', 'workshop', 'beginner'],
            capacity: 100,
            visibility: 'public',
            status: 'published',
            detailedDescription: {
                mainProgram: 'Workshop 3 giờ về Digital Marketing cơ bản',
                guests: 'Chuyên gia Marketing hàng đầu',
                specialExperiences: 'Học thực hành trực tiếp'
            },
            termsAndConditions: 'Vui lòng đến đúng giờ và mang theo laptop.',
            organizer: {
                logo: '',
                name: organizer.fullName || organizer.username,
                info: 'Trung tâm đào tạo Marketing'
            },
            eventOrganizerDetails: {
                logo: '',
                name: organizer.fullName || organizer.username,
                info: 'Chuyên gia với 10 năm kinh nghiệm'
            },
            availableSeats: 100,
            seatingMap: null, // KHÔNG có seatingMap
            ticketTypes: [],
            templateType: 'general' // Template general - không có seating
        };

        const event = new Event(eventData);
        await event.save();
        console.log('✅ Tạo sự kiện thành công:', event.title);
        console.log('📍 Event ID:', event._id);

        // 2. Tạo ticket types
        const ticketTypesData = [
            {
                name: 'Early Bird',
                description: 'Vé ưu đãi sớm - giảm 30%',
                price: 500000,
                quantity: 30,
                totalQuantity: 30,
                event: event._id,
                isActive: true,
                saleStartDate: new Date(),
                saleEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            },
            {
                name: 'Regular',
                description: 'Vé thường',
                price: 700000,
                quantity: 50,
                totalQuantity: 50,
                event: event._id,
                isActive: true,
                saleStartDate: new Date(),
                saleEndDate: new Date(event.startDate.getTime() - 60 * 60 * 1000)
            },
            {
                name: 'VIP Package',
                description: 'Gói VIP - bao gồm tài liệu và ăn trưa',
                price: 1200000,
                quantity: 20,
                totalQuantity: 20,
                event: event._id,
                isActive: true,
                saleStartDate: new Date(),
                saleEndDate: new Date(event.startDate.getTime() - 60 * 60 * 1000)
            }
        ];

        const createdTicketTypes = await TicketType.insertMany(ticketTypesData);
        console.log(`✅ Tạo ${createdTicketTypes.length} loại vé thành công`);

        // 3. Update event với ticket types
        event.ticketTypes = createdTicketTypes.map(tt => tt._id);
        await event.save();

        console.log('\n🎉 SỰ KIỆN TEST ĐƯỢC TẠO THÀNH CÔNG!');
        console.log('📧 Test URL (Simple Booking):', `http://localhost:3000/simple-booking/${event._id}`);
        console.log('📧 Test URL (Regular Booking):', `http://localhost:3000/booking/${event._id}`);
        console.log('📧 Event Detail:', `http://localhost:3000/events/${event._id}`);
        console.log('\n✨ Logic kiểm tra:');
        console.log('  - Không có seatingMap → BookingPage sẽ hiển thị form booking thường');
        console.log('  - Có 3 loại vé để chọn');
        console.log('  - Template type: general');

    } catch (error) {
        console.error('❌ Lỗi khi tạo sự kiện:', error);
    } finally {
        mongoose.connection.close();
    }
};

// Chạy script
createSimpleEvent(); 