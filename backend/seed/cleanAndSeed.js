require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Event = require('../models/Event');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const TicketType = require('../models/TicketType');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const Transaction = require('../models/Transaction');
const OwnerRequest = require('../models/OwnerRequest');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Otp = require('../models/Otp');
const RefundRequest = require('../models/RefundRequest');

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Fix mongoose deprecation warning
    mongoose.set('strictQuery', false);

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true,
      retryWrites: true,
      retryReads: true
    });
    
    console.log('💽 MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clean all collections
const cleanDatabase = async () => {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Delete data from all collections that we know exist
    await Promise.all([
      User.deleteMany({}),
      Event.deleteMany({}),
      Venue.deleteMany({}),
      Booking.deleteMany({}),
      Ticket.deleteMany({}),
      TicketType.deleteMany({}),
      Payment.deleteMany({}),
      Review.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Report.deleteMany({}),
      Notification.deleteMany({}),
      ActivityLog.deleteMany({}),
      Transaction.deleteMany({}),
      OwnerRequest.deleteMany({}),
      Message.deleteMany({}),
      Conversation.deleteMany({}),
      Otp.deleteMany({}),
      RefundRequest.deleteMany({})
    ]);
    
    // Try to delete other collections if they exist
    try {
      if (mongoose.connection.collections.complaints) {
        await mongoose.connection.collections.complaints.deleteMany({});
      }
      if (mongoose.connection.collections.violationreports) {
        await mongoose.connection.collections.violationreports.deleteMany({});
      }
      if (mongoose.connection.collections.contentsections) {
        await mongoose.connection.collections.contentsections.deleteMany({});
      }
    } catch (innerError) {
      console.log('Some collections do not exist, continuing...');
    }
    
    console.log('✅ Database cleaned successfully');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
};

// Create admin and sample users
const createUsers = async () => {
  try {
    console.log('👤 Creating users...');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Create admin
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      fullName: 'Admin User',
      role: 'admin',
      isVerified: true,
      status: 'active',
      phone: '0123456789',
      gender: 'other',
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff'
    });
    
    // Create event owner
    const eventOwner = await User.create({
      username: 'eventowner',
      email: 'owner@example.com',
      password: hashedPassword,
      fullName: 'Event Owner',
      role: 'event_owner',
      isVerified: true,
      status: 'active',
      phone: '0123456788',
      gender: 'other',
      avatar: 'https://ui-avatars.com/api/?name=Owner&background=00AA55&color=fff',
      ownerRequestStatus: 'approved'
    });
    
    // Create regular users
    const user1 = await User.create({
      username: 'user1',
      email: 'user1@example.com',
      password: hashedPassword,
      fullName: 'Regular User',
      role: 'user',
      isVerified: true,
      status: 'active',
      phone: '0123456787',
      gender: 'other',
      avatar: 'https://ui-avatars.com/api/?name=User1&background=FF5733&color=fff'
    });
    
    const user2 = await User.create({
      username: 'user2',
      email: 'user2@example.com',
      password: hashedPassword,
      fullName: 'Another User',
      role: 'user',
      isVerified: true,
      status: 'active',
      phone: '0123456786',
      gender: 'other',
      avatar: 'https://ui-avatars.com/api/?name=User2&background=33A1FF&color=fff'
    });
    
    console.log('✅ Users created successfully');
    return { admin, eventOwner, user1, user2 };
  } catch (error) {
    console.error('❌ Error creating users:', error);
    process.exit(1);
  }
};

// Create venues
const createVenues = async () => {
  try {
    console.log('🏢 Creating venues...');
    
    const venues = await Promise.all([
      Venue.create({
        name: 'Nhà Văn Hoá Thanh Niên',
        address: '4 Phạm Ngọc Thạch',
        district: 'Quận 1',
        city: 'TP. Hồ Chí Minh',
        country: 'Vietnam',
        capacity: 1500,
        description: 'Nhà Văn Hóa Thanh Niên là một địa điểm tổ chức sự kiện văn hóa, nghệ thuật nổi tiếng tại Thành phố Hồ Chí Minh.',
        amenities: ['Parking', 'Air Conditioning', 'Sound System', 'Stage Lighting'],
        images: ['https://yourvenues.vn/wp-content/uploads/2022/10/nha-van-hoa-thanh-nien-tphcm-1.jpg'],
        status: 'active',
        venueType: 'indoor'
      }),
      Venue.create({
        name: 'Nhà thi đấu Phú Thọ',
        address: '221 Lý Thường Kiệt',
        district: 'Quận 11',
        city: 'TP. Hồ Chí Minh',
        country: 'Vietnam',
        capacity: 5000,
        description: 'Nhà thi đấu Phú Thọ là một trong những địa điểm tổ chức sự kiện lớn nhất Thành phố Hồ Chí Minh.',
        amenities: ['Parking', 'Air Conditioning', 'Sound System', 'Stage Lighting', 'Security'],
        images: ['https://upload.wikimedia.org/wikipedia/commons/1/1f/Phu_Tho_Indoor_Stadium.jpg'],
        status: 'active',
        venueType: 'indoor'
      }),
      Venue.create({
        name: 'Hội trường Thống Nhất',
        address: '135 Nam Kỳ Khởi Nghĩa',
        district: 'Quận 1',
        city: 'TP. Hồ Chí Minh',
        country: 'Vietnam',
        capacity: 1200,
        description: 'Hội trường Thống Nhất là một địa điểm lý tưởng cho các sự kiện chính trị, văn hóa và hội nghị.',
        amenities: ['Parking', 'Air Conditioning', 'Sound System', 'Stage', 'Security'],
        images: ['https://cdn.vntrip.vn/cam-nang/wp-content/uploads/2018/03/hoi-truong-thong-nhat-1.png'],
        status: 'active',
        venueType: 'indoor'
      })
    ]);
    
    console.log('✅ Venues created successfully');
    return venues;
  } catch (error) {
    console.error('❌ Error creating venues:', error);
    process.exit(1);
  }
};

// Create events with ticket types
const createEvents = async (users, venues) => {
  try {
    console.log('🎭 Creating events...');
    
    // Create online event
    const onlineEvent = await Event.create({
      title: 'Workshop Online: Kỹ năng phát triển bản thân',
      description: 'Workshop trực tuyến về các kỹ năng phát triển bản thân trong thời đại số. Chương trình được thiết kế để giúp các bạn trẻ định hướng nghề nghiệp và phát triển kỹ năng mềm.',
      images: {
        banner: 'https://img.freepik.com/free-vector/webinar-concept-illustration_114360-4764.jpg',
        logo: 'https://img.freepik.com/free-vector/webinar-concept-illustration_114360-4764.jpg'
      },
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours duration
      location: {
        type: 'online',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        platform: 'google-meet'
      },
      category: ['Workshop', 'Education', 'Self-development'],
      tags: ['workshop', 'online', 'kỹ năng', 'phát triển bản thân'],
      status: 'approved',
      visibility: 'public',
      organizers: [users.eventOwner._id],
      capacity: 500,
      availableSeats: 500,
      featured: true,
      special: false,
      trending: true,
      views: 120
    });
    
    // Create ticket types for online event
    await TicketType.create({
      name: 'Vé Thường',
      price: 50000,
      totalQuantity: 300,
      availableQuantity: 300,
      event: onlineEvent._id,
      description: 'Vé tham dự workshop với đầy đủ quyền lợi',
      color: '#3B82F6'
    });
    
    await TicketType.create({
      name: 'Vé VIP',
      price: 150000,
      totalQuantity: 100,
      availableQuantity: 100,
      event: onlineEvent._id,
      description: 'Vé VIP bao gồm tài liệu bổ sung và phiên hỏi đáp riêng với diễn giả',
      color: '#8B5CF6'
    });
    
    // Create music concert event
    const concertEvent = await Event.create({
      title: 'Đêm nhạc Chào Hè 2023',
      description: 'Đêm nhạc hoành tráng với sự góp mặt của các ca sĩ hàng đầu Việt Nam. Chương trình hứa hẹn mang đến những màn trình diễn đỉnh cao và không khí sôi động cho mùa hè này.',
      images: {
        banner: 'https://img.freepik.com/free-photo/silhouettes-happy-people-front-bright-stage-lights_181624-45269.jpg',
        logo: 'https://img.freepik.com/free-photo/silhouettes-happy-people-front-bright-stage-lights_181624-45269.jpg'
      },
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // 5 hours duration
      location: {
        type: 'offline',
        venue: venues[0]._id,
        venueName: venues[0].name,
        address: venues[0].address,
        district: venues[0].district,
        city: venues[0].city,
        country: venues[0].country,
        venueLayout: 'concert'
      },
      category: ['Music', 'Concert', 'Entertainment'],
      tags: ['concert', 'music', 'live', 'summer'],
      status: 'approved',
      visibility: 'public',
      organizers: [users.eventOwner._id],
      capacity: 1500,
      availableSeats: 1500,
      featured: true,
      special: true,
      trending: true,
      views: 350,
      seatingMap: {
        layoutType: 'concert',
        sections: [
          {
            name: 'VIP',
            ticketTier: null, // Will be updated after ticket type creation
            rows: [
              {
                name: 'A',
                seats: Array.from({ length: 20 }, (_, i) => ({
                  number: `${i + 1}`,
                  status: 'available',
                  available: true,
                  x: 100 + i * 30,
                  y: 150
                }))
              },
              {
                name: 'B',
                seats: Array.from({ length: 20 }, (_, i) => ({
                  number: `${i + 1}`,
                  status: 'available',
                  available: true,
                  x: 100 + i * 30,
                  y: 180
                }))
              }
            ],
            x: 100,
            y: 150,
            width: 600,
            height: 60
          },
          {
            name: 'Standard',
            ticketTier: null, // Will be updated after ticket type creation
            rows: [
              {
                name: 'C',
                seats: Array.from({ length: 25 }, (_, i) => ({
                  number: `${i + 1}`,
                  status: 'available',
                  available: true,
                  x: 70 + i * 30,
                  y: 220
                }))
              },
              {
                name: 'D',
                seats: Array.from({ length: 25 }, (_, i) => ({
                  number: `${i + 1}`,
                  status: 'available',
                  available: true,
                  x: 70 + i * 30,
                  y: 250
                }))
              },
              {
                name: 'E',
                seats: Array.from({ length: 25 }, (_, i) => ({
                  number: `${i + 1}`,
                  status: 'available',
                  available: true,
                  x: 70 + i * 30,
                  y: 280
                }))
              }
            ],
            x: 70,
            y: 220,
            width: 750,
            height: 90
          }
        ],
        stage: {
          x: 300,
          y: 50,
          width: 300,
          height: 60
        }
      }
    });
    
    // Create ticket types for concert event
    const vipTicket = await TicketType.create({
      name: 'VIP',
      price: 500000,
      totalQuantity: 40,
      availableQuantity: 40,
      event: concertEvent._id,
      description: 'Vé khu VIP với vị trí đẹp nhất và đồ uống miễn phí',
      color: '#8B5CF6'
    });
    
    const standardTicket = await TicketType.create({
      name: 'Standard',
      price: 300000,
      totalQuantity: 75,
      availableQuantity: 75,
      event: concertEvent._id,
      description: 'Vé thường với tầm nhìn tốt',
      color: '#3B82F6'
    });
    
    // Update ticket tier references in seating map
    concertEvent.seatingMap.sections[0].ticketTier = vipTicket._id;
    concertEvent.seatingMap.sections[1].ticketTier = standardTicket._id;
    await concertEvent.save();
    
    // Create conference event
    const conferenceEvent = await Event.create({
      title: 'Hội nghị Công nghệ Việt Nam 2023',
      description: 'Hội nghị về các xu hướng công nghệ mới nhất tại Việt Nam và thế giới. Với sự tham gia của các chuyên gia hàng đầu trong ngành công nghệ.',
      images: {
        banner: 'https://img.freepik.com/free-photo/audience-paying-attention-business-meeting-modern-conference-room_482257-1452.jpg',
        logo: 'https://img.freepik.com/free-photo/audience-paying-attention-business-meeting-modern-conference-room_482257-1452.jpg'
      },
      startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      endDate: new Date(Date.now() + 47 * 24 * 60 * 60 * 1000), // 2 days duration
      location: {
        type: 'offline',
        venue: venues[2]._id,
        venueName: venues[2].name,
        address: venues[2].address,
        district: venues[2].district,
        city: venues[2].city,
        country: venues[2].country,
        venueLayout: 'hall'
      },
      category: ['Conference', 'Technology', 'Business'],
      tags: ['conference', 'tech', 'business', 'networking'],
      status: 'approved',
      visibility: 'public',
      organizers: [users.eventOwner._id],
      capacity: 1000,
      availableSeats: 1000,
      featured: false,
      special: true,
      trending: false,
      views: 200
    });
    
    // Create ticket types for conference event
    await TicketType.create({
      name: 'Early Bird',
      price: 800000,
      totalQuantity: 300,
      availableQuantity: 300,
      event: conferenceEvent._id,
      description: 'Vé ưu đãi đặt sớm với đầy đủ quyền lợi tham dự',
      color: '#10B981'
    });
    
    await TicketType.create({
      name: 'Standard',
      price: 1200000,
      totalQuantity: 500,
      availableQuantity: 500,
      event: conferenceEvent._id,
      description: 'Vé thường với đầy đủ quyền lợi tham dự',
      color: '#3B82F6'
    });
    
    await TicketType.create({
      name: 'VIP',
      price: 2000000,
      totalQuantity: 200,
      availableQuantity: 200,
      event: conferenceEvent._id,
      description: 'Vé VIP bao gồm quyền tham dự tiệc networking và gặp gỡ diễn giả',
      color: '#8B5CF6'
    });
    
    // Create sports event
    const sportsEvent = await Event.create({
      title: 'Giải bóng đá giao hữu các doanh nghiệp',
      description: 'Giải bóng đá giao hữu giữa các doanh nghiệp lớn, hứa hẹn mang lại những trận đấu hấp dẫn và tinh thần thể thao đoàn kết.',
      images: {
        banner: 'https://img.freepik.com/free-photo/soccer-players-action-professional-stadium_654080-1820.jpg',
        logo: 'https://img.freepik.com/free-photo/soccer-players-action-professional-stadium_654080-1820.jpg'
      },
      startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8 hours duration
      location: {
        type: 'offline',
        venue: venues[1]._id,
        venueName: venues[1].name,
        address: venues[1].address,
        district: venues[1].district,
        city: venues[1].city,
        country: venues[1].country,
        venueLayout: 'footballStadium'
      },
      category: ['Sports', 'Football', 'Entertainment'],
      tags: ['football', 'sports', 'competition', 'friendly'],
      status: 'approved',
      visibility: 'public',
      organizers: [users.eventOwner._id],
      capacity: 3000,
      availableSeats: 3000,
      featured: true,
      special: false,
      trending: true,
      views: 250
    });
    
    // Create ticket types for sports event
    await TicketType.create({
      name: 'General',
      price: 100000,
      totalQuantity: 2000,
      availableQuantity: 2000,
      event: sportsEvent._id,
      description: 'Vé phổ thông',
      color: '#3B82F6'
    });
    
    await TicketType.create({
      name: 'Premium',
      price: 250000,
      totalQuantity: 1000,
      availableQuantity: 1000,
      event: sportsEvent._id,
      description: 'Vé cao cấp với vị trí đẹp',
      color: '#8B5CF6'
    });
    
    console.log('✅ Events created successfully');
    return { onlineEvent, concertEvent, conferenceEvent, sportsEvent };
  } catch (error) {
    console.error('❌ Error creating events:', error);
    process.exit(1);
  }
};

// Main function
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Clean database
    await cleanDatabase();
    
    // Create users
    const users = await createUsers();
    
    // Create venues
    const venues = await createVenues();
    
    // Create events
    await createEvents(users, venues);
    
    console.log('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase(); 