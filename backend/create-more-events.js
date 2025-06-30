const mongoose = require('mongoose');
const Event = require('./models/Event');
const TicketType = require('./models/TicketType');
const Venue = require('./models/Venue');
const User = require('./models/User');

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/event-ticketing-platform', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Dữ liệu sự kiện mẫu
const sampleEvents = [
    {
        title: 'Lễ hội âm nhạc mùa hè 2025',
        description: 'Lễ hội âm nhạc lớn nhất năm với sự tham gia của nhiều nghệ sĩ nổi tiếng',
        category: 'Âm nhạc',
        eventType: 'simple',
        ticketTypes: [
            { name: 'Early Bird', price: 250000, quantity: 500 },
            { name: 'VIP', price: 800000, quantity: 100 },
            { name: 'Standard', price: 400000, quantity: 1000 }
        ],
        featured: true,
        special: false,
        trending: false
    },
    {
        title: 'Đêm hội chợ ẩm thực Sài Gòn',
        description: 'Khám phá hương vị ẩm thực đường phố đặc sắc nhất Sài Gòn',
        category: 'Ẩm thực',
        eventType: 'simple',
        ticketTypes: [
            { name: 'Combo 1', price: 150000, quantity: 300 },
            { name: 'Combo 2', price: 200000, quantity: 200 },
            { name: 'Family Pack', price: 500000, quantity: 100 }
        ],
        featured: false,
        special: true,
        trending: false
    },
    {
        title: 'Triển lãm nghệ thuật đương đại',
        description: 'Triển lãm các tác phẩm nghệ thuật đương đại của các họa sĩ trẻ',
        category: 'Nghệ thuật',
        eventType: 'simple',
        ticketTypes: [
            { name: 'Thường', price: 50000, quantity: 200 },
            { name: 'Sinh viên', price: 30000, quantity: 100 }
        ],
        featured: false,
        special: false,
        trending: true
    },
    {
        title: 'Hội thảo khởi nghiệp 2025',
        description: 'Hội thảo chia sẻ kinh nghiệm khởi nghiệp từ các chuyên gia hàng đầu',
        category: 'Giáo dục',
        eventType: 'simple',
        ticketTypes: [
            { name: 'Standard', price: 100000, quantity: 300 },
            { name: 'Premium', price: 200000, quantity: 50 }
        ],
        featured: false,
        special: false,
        trending: false
    },
    {
        title: 'Concert Acoustic Indie',
        description: 'Đêm nhạc acoustic với các ban nhạc indie underground',
        category: 'Âm nhạc',
        eventType: 'simple',
        ticketTypes: [
            { name: 'VIP Front', price: 500000, quantity: 50 },
            { name: 'Standard', price: 200000, quantity: 150 },
            { name: 'Standing', price: 100000, quantity: 100 }
        ],
        featured: true,
        special: false,
        trending: true
    },
    {
        title: 'Lễ hội văn hóa dân gian',
        description: 'Trải nghiệm văn hóa dân gian truyền thống Việt Nam',
        category: 'Văn hóa',
        eventType: 'simple',
        ticketTypes: [
            { name: 'Người lớn', price: 80000, quantity: 500 },
            { name: 'Trẻ em', price: 40000, quantity: 200 }
        ],
        featured: false,
        special: true,
        trending: false
    },
    {
        title: 'Đại hội thể thao điện tử',
        description: 'Giải đấu esports với tổng giải thưởng lên đến 1 tỷ đồng',
        category: 'Thể thao',
        eventType: 'simple',
        ticketTypes: [
            { name: 'Premium', price: 300000, quantity: 100 },
            { name: 'Standard', price: 150000, quantity: 300 },
            { name: 'Student', price: 100000, quantity: 200 }
        ],
        featured: false,
        special: false,
        trending: true
    },
    {
        title: 'Workshop Nhiếp ảnh Chuyên nghiệp',
        description: 'Khóa học nhiếp ảnh từ cơ bản đến nâng cao với các chuyên gia',
        category: 'Giáo dục',
        eventType: 'simple',
        ticketTypes: [
            { name: 'Basic', price: 500000, quantity: 30 },
            { name: 'Advanced', price: 800000, quantity: 20 }
        ],
        featured: false,
        special: true,
        trending: false
    },
    {
        title: 'Chợ phiên cuối tuần',
        description: 'Chợ phiên với các sản phẩm handmade và thực phẩm organic',
        category: 'Mua sắm',
        eventType: 'simple',
        ticketTypes: [
            { name: 'Vé vào cửa', price: 20000, quantity: 1000 }
        ],
        featured: false,
        special: false,
        trending: false
    },
    {
        title: 'Gala Từ thiện 2025',
        description: 'Đêm gala từ thiện gây quỹ cho trẻ em vùng cao',
        category: 'Từ thiện',
        eventType: 'simple',
        ticketTypes: [
            { name: 'Diamond', price: 2000000, quantity: 20 },
            { name: 'Gold', price: 1000000, quantity: 50 },
            { name: 'Silver', price: 500000, quantity: 100 }
        ],
        featured: true,
        special: true,
        trending: false
    }
];

async function createMoreEvents() {
    try {
        console.log('🏗️ Bắt đầu tạo thêm sự kiện...');

        // Tìm user owner để gán sự kiện
        const eventOwner = await User.findOne({ role: 'event_owner' });
        
        if (!eventOwner) {
            console.log('❌ Không tìm thấy event owner');
            return;
        }

        // Tạo venue mẫu nếu chưa có
        let venue = await Venue.findOne();
        if (!venue) {
            venue = new Venue({
                name: 'Trung tâm Hội nghị Quốc gia',
                address: 'Số 1 Đại lộ Thăng Long, Nam Từ Liêm, Hà Nội',
                city: 'Hà Nội',
                capacity: 2000,
                facilities: ['Âm thanh chuyên nghiệp', 'Đèn sân khấu', 'Điều hòa', 'Bãi đậu xe'],
                pricePerHour: 500000
            });
            await venue.save();
            console.log('✅ Đã tạo venue mẫu');
        }

        for (let i = 0; i < sampleEvents.length; i++) {
            const eventData = sampleEvents[i];
            
            // Tạo event
            const startDate = new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000);
            const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000); // 4 giờ sau startDate
            
            const event = new Event({
                title: eventData.title,
                description: eventData.description,
                category: [eventData.category],
                templateType: eventData.eventType === 'seating' ? 'seating' : 'general',
                startDate: startDate,
                endDate: endDate,
                location: {
                    type: 'offline',
                    venue: venue._id,
                    venueName: venue.name,
                    address: venue.address,
                    city: venue.city,
                    venueLayout: 'hall'
                },
                organizers: [eventOwner._id],
                capacity: eventData.ticketTypes.reduce((sum, tt) => sum + tt.quantity, 0),
                images: {
                    banner: `https://picsum.photos/800/600?random=${i + 100}`, // Random placeholder images
                    logo: `https://picsum.photos/200/200?random=${i + 200}`
                },
                status: 'approved',
                featured: eventData.featured,
                special: eventData.special,
                trending: eventData.trending,
                featuredOrder: eventData.featured ? Math.floor(Math.random() * 10) : null,
                specialOrder: eventData.special ? Math.floor(Math.random() * 10) : null,
                trendingOrder: eventData.trending ? Math.floor(Math.random() * 10) : null
            });

            await event.save();

            // Tạo ticket types
            const ticketTypes = [];
            for (const ticketData of eventData.ticketTypes) {
                const ticketType = new TicketType({
                    event: event._id,
                    name: ticketData.name,
                    price: ticketData.price,
                    quantity: ticketData.quantity,
                    availableQuantity: ticketData.quantity
                });
                await ticketType.save();
                ticketTypes.push(ticketType._id);
            }

            // Cập nhật event với ticket types
            event.ticketTypes = ticketTypes;
            await event.save();

            console.log(`✅ Đã tạo sự kiện: ${eventData.title}`);
        }

        console.log('🎉 Đã tạo thành công tất cả sự kiện!');
        console.log(`📊 Tổng số sự kiện trong database: ${await Event.countDocuments()}`);
        
        // Hiển thị thống kê
        const featuredCount = await Event.countDocuments({ featured: true });
        const specialCount = await Event.countDocuments({ special: true });
        const trendingCount = await Event.countDocuments({ trending: true });
        
        console.log(`🌟 Featured events: ${featuredCount}`);
        console.log(`⭐ Special events: ${specialCount}`);
        console.log(`🔥 Trending events: ${trendingCount}`);

    } catch (error) {
        console.error('❌ Lỗi khi tạo sự kiện:', error);
    } finally {
        mongoose.connection.close();
    }
}

createMoreEvents(); 