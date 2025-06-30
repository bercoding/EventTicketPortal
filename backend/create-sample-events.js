const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');
const TicketType = require('./models/TicketType');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-ticketing-platform');
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const createSampleEvents = async () => {
  try {
    // Tìm hoặc tạo event owner
    let eventOwner = await User.findOne({ email: 'owner@ticketbox.com' });
    if (!eventOwner) {
      eventOwner = await User.create({
        username: 'eventowner2025',
        email: 'owner@ticketbox.com',
        password: 'owner123',
        fullName: 'Event Owner',
        role: 'event_owner',
        ownerRequestStatus: 'approved'
      });
      console.log('✅ Created event owner');
    }

    // Sample events data
    const eventsData = [
      {
        title: 'Đêm nhạc Việt Nam 2025',
        description: 'Đêm nhạc tuyệt vời với các ca sĩ nổi tiếng',
        detailedDescription: 'Một đêm nhạc đầy cảm xúc với những ca khúc bất hủ',
        category: ['music'],
        startDate: new Date('2025-03-15T19:00:00Z'),
        endDate: new Date('2025-03-15T22:00:00Z'),
        location: {
          type: 'offline',
          venueName: 'Nhà hát Lớn Hà Nội',
          address: '1 Tràng Tiền, Hoàn Kiếm, Hà Nội',
          city: 'Hà Nội',
          country: 'Vietnam'
        },
        capacity: 800,
        visibility: 'public',
        status: 'approved',
        featured: true,
        special: false,
        trending: false,
        featuredOrder: 1,
        specialOrder: 0,
        trendingOrder: 0,
        images: {
          banner: '/uploads/events/event-banner-1.jpg',
          logo: '/uploads/events/event-logo-1.jpg'
        },
        organizers: [eventOwner._id],
        isSeatingEvent: false
      },
      {
        title: 'Festival Ẩm thực Quốc tế',
        description: 'Khám phá hương vị từ khắp thế giới',
        detailedDescription: 'Festival ẩm thực với các món ăn đặc sản từ nhiều quốc gia',
        category: ['food'],
        startDate: new Date('2025-04-20T10:00:00Z'),
        endDate: new Date('2025-04-22T22:00:00Z'),
        location: {
          type: 'offline',
          venueName: 'Công viên Thống Nhất',
          address: 'Hai Bà Trưng, Hà Nội',
          city: 'Hà Nội',
          country: 'Vietnam'
        },
        capacity: 5000,
        visibility: 'public',
        status: 'approved',
        featured: false,
        special: true,
        trending: true,
        featuredOrder: 0,
        specialOrder: 1,
        trendingOrder: 1,
        images: {
          banner: '/uploads/events/event-banner-2.jpg',
          logo: '/uploads/events/event-logo-2.jpg'
        },
        organizers: [eventOwner._id],
        isSeatingEvent: false
      },
      {
        title: 'Hội thảo Khởi nghiệp & Đầu tư 2025',
        description: 'Cơ hội kết nối với các nhà đầu tư hàng đầu',
        detailedDescription: 'Hội thảo về khởi nghiệp và cơ hội đầu tư trong năm 2025',
        category: ['business'],
        startDate: new Date('2025-02-10T08:00:00Z'),
        endDate: new Date('2025-02-10T17:00:00Z'),
        location: {
          type: 'offline',
          venueName: 'JW Marriott Hanoi',
          address: '8 Đỗ Đức Dục, Nam Từ Liêm, Hà Nội',
          city: 'Hà Nội',
          country: 'Vietnam'
        },
        capacity: 500,
        visibility: 'public',
        status: 'approved',
        featured: true,
        special: false,
        trending: false,
        featuredOrder: 2,
        specialOrder: 0,
        trendingOrder: 0,
        images: {
          banner: '/uploads/events/event-banner-3.jpg',
          logo: '/uploads/events/event-logo-3.jpg'
        },
        organizers: [eventOwner._id],
        isSeatingEvent: false
      },
      {
        title: 'Triển lãm Công nghệ AI & Blockchain 2025',
        description: 'Khám phá công nghệ tương lai',
        detailedDescription: 'Triển lãm về trí tuệ nhân tạo và công nghệ blockchain',
        category: ['technology'],
        startDate: new Date('2025-05-15T09:00:00Z'),
        endDate: new Date('2025-05-17T18:00:00Z'),
        location: {
          type: 'offline',
          venueName: 'Trung tâm Hội nghị Quốc gia',
          address: 'Đình Thôn, Nam Từ Liêm, Hà Nội',
          city: 'Hà Nội',
          country: 'Vietnam'
        },
        capacity: 2000,
        visibility: 'public',
        status: 'approved',
        featured: false,
        special: true,
        trending: false,
        featuredOrder: 0,
        specialOrder: 2,
        trendingOrder: 0,
        images: {
          banner: '/uploads/events/event-banner-4.jpg',
          logo: '/uploads/events/event-logo-4.jpg'
        },
        organizers: [eventOwner._id],
        isSeatingEvent: false
      },
      {
        title: 'Đêm Jazz tại Hồ Tây',
        description: 'Thưởng thức jazz bên bờ hồ',
        detailedDescription: 'Đêm nhạc jazz thư giãn với view hồ Tây tuyệt đẹp',
        category: ['music'],
        startDate: new Date('2025-06-01T19:30:00Z'),
        endDate: new Date('2025-06-01T23:00:00Z'),
        location: {
          type: 'offline',
          venueName: 'Summit Lounge',
          address: 'Lotte Tower, 54 Liễu Giai, Ba Đình, Hà Nội',
          city: 'Hà Nội',
          country: 'Vietnam'
        },
        capacity: 200,
        visibility: 'public',
        status: 'approved',
        featured: false,
        special: true,
        trending: true,
        featuredOrder: 0,
        specialOrder: 3,
        trendingOrder: 2,
        images: {
          banner: '/uploads/events/event-banner-5.jpg',
          logo: '/uploads/events/event-logo-5.jpg'
        },
        organizers: [eventOwner._id],
        isSeatingEvent: false
      },
      {
        title: 'Workshop Digital Marketing 2025',
        description: 'Học marketing số từ chuyên gia',
        detailedDescription: 'Workshop thực hành về digital marketing và social media',
        category: ['education'],
        startDate: new Date('2025-03-25T13:00:00Z'),
        endDate: new Date('2025-03-25T17:00:00Z'),
        location: {
          type: 'offline',
          venueName: 'Coworking Space Hà Nội',
          address: '15 Nguyễn Du, Hai Bà Trưng, Hà Nội',
          city: 'Hà Nội',
          country: 'Vietnam'
        },
        capacity: 300,
        visibility: 'public',
        status: 'approved',
        featured: false,
        special: false,
        trending: true,
        featuredOrder: 0,
        specialOrder: 0,
        trendingOrder: 3,
        images: {
          banner: '/uploads/events/event-banner-6.jpg',
          logo: '/uploads/events/event-logo-6.jpg'
        },
        organizers: [eventOwner._id],
        isSeatingEvent: false
      }
    ];

    // Xóa events cũ
    await Event.deleteMany({});
    await TicketType.deleteMany({});
    console.log('🗑️ Deleted old events and ticket types');

    // Tạo events mới
    for (const eventData of eventsData) {
      const event = await Event.create(eventData);
      
      // Tạo ticket types cho mỗi event
      const ticketTypesData = [
        {
          event: event._id,
          name: 'VIP',
          price: 500000,
          quantity: Math.floor(event.capacity * 0.2),
          description: 'Vé VIP với dịch vụ đặc biệt'
        },
        {
          event: event._id,
          name: 'Thường',
          price: 200000,
          quantity: Math.floor(event.capacity * 0.8),
          description: 'Vé thường'
        }
      ];

      const createdTicketTypes = await TicketType.insertMany(ticketTypesData);
      
      // Cập nhật event với ticketTypes
      event.ticketTypes = createdTicketTypes.map(tt => tt._id);
      await event.save();
      
      console.log(`✅ Created event: ${event.title} with ${createdTicketTypes.length} ticket types`);
    }

    console.log('🎉 Sample events created successfully!');
    console.log('📊 Events summary:');
    console.log('- Featured events: 2');
    console.log('- Special events: 3'); 
    console.log('- Trending events: 3');
    console.log('- Regular events: 1');
    
  } catch (error) {
    console.error('❌ Error creating sample events:', error);
  }
};

const main = async () => {
  await connectDB();
  await createSampleEvents();
  process.exit(0);
};

main(); 