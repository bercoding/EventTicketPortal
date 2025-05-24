const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../config/db');
const {
  User, Event, Venue, Booking, Ticket,
  Payment, Review, Post, Comment, Report,
  Notification, ActivityLog, Transaction
} = require('../models');

async function seedDatabase() {
  try {
    // Kết nối đến MongoDB
    await connectDB();
    console.log('Đã kết nối đến MongoDB. Bắt đầu tạo dữ liệu mẫu...');

    // Xóa dữ liệu cũ (tùy chọn)
    console.log('Xóa dữ liệu cũ...');
    await Promise.all([
      User.deleteMany({}),
      Event.deleteMany({}),
      Venue.deleteMany({}),
      Booking.deleteMany({}),
      Ticket.deleteMany({}),
      Payment.deleteMany({}),
      Review.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Report.deleteMany({}),
      Notification.deleteMany({}),
      ActivityLog.deleteMany({}),
      Transaction.deleteMany({})
    ]);

    // 1. Tạo users
    console.log('Tạo users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      fullName: 'Admin User',
      role: 'admin',
      status: 'active'
    });

    const eventOwner = await User.create({
      username: 'eventowner',
      email: 'owner@example.com',
      password: hashedPassword,
      fullName: 'Event Owner',
      role: 'event_owner',
      status: 'active'
    });

    const user1 = await User.create({
      username: 'user1',
      email: 'user1@example.com',
      password: hashedPassword,
      fullName: 'User One',
      role: 'user',
      status: 'active'
    });

    const user2 = await User.create({
      username: 'user2',
      email: 'user2@example.com',
      password: hashedPassword,
      fullName: 'User Two',
      role: 'user',
      status: 'active'
    });

    console.log(`Đã tạo ${await User.countDocuments()} users`);

    // 2. Tạo venues
    console.log('Tạo venues...');
    const venue1 = await Venue.create({
      name: 'Nhà hát Hòa Bình',
      address: '240 Đường 3/2, Phường 12',
      city: 'Hồ Chí Minh',
      country: 'Việt Nam',
      capacity: 1500,
      coordinates: {
        type: 'Point',
        coordinates: [106.6827, 10.7731] // [longitude, latitude]
      },
      location: {
        latitude: 10.7731,
        longitude: 106.6827
      },
      facilities: ['Parking', 'Air Conditioning', 'Stage'],
      contactInfo: {
        phone: '028 3930 8888',
        email: 'info@hoabinhtheater.com',
        website: 'hoabinhtheater.com'
      }
    });

    const venue2 = await Venue.create({
      name: 'Trung tâm Hội nghị Quốc gia',
      address: 'Phạm Hùng, Mễ Trì',
      city: 'Hà Nội',
      country: 'Việt Nam',
      capacity: 3800,
      coordinates: {
        type: 'Point',
        coordinates: [105.7825, 21.0042] // [longitude, latitude]
      },
      location: {
        latitude: 21.0042,
        longitude: 105.7825
      },
      facilities: ['Conference Rooms', 'Exhibition Space', 'Parking'],
      contactInfo: {
        phone: '024 3792 7324',
        email: 'info@ncc.gov.vn',
        website: 'ncc.gov.vn'
      }
    });

    console.log(`Đã tạo ${await Venue.countDocuments()} venues`);

    // 3. Tạo events
    console.log('Tạo events...');
    const event1 = await Event.create({
      title: 'Đêm nhạc Trịnh Công Sơn',
      description: 'Đêm nhạc tri ân nhạc sĩ Trịnh Công Sơn với các ca khúc bất hủ',
      images: ['trinh_cong_son_1.jpg', 'trinh_cong_son_2.jpg'],
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày sau
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 giờ sau khi bắt đầu
      location: {
        venue: venue1._id,
        address: venue1.address,
        city: venue1.city,
        country: venue1.country,
        coordinates: {
          type: 'Point',
          coordinates: [106.6827, 10.7731] // [longitude, latitude]
        },
        location: {
          latitude: 10.7731,
          longitude: 106.6827
        }
      },
      category: ['Âm nhạc', 'Hòa nhạc'],
      tags: ['Trịnh Công Sơn', 'nhạc trữ tình'],
      status: 'approved',
      visibility: 'public',
      organizer: eventOwner._id,
      capacity: 1000,
      availableSeats: 1000,
      ticketTypes: [
        {
          name: 'VIP',
          description: 'Vé VIP bao gồm suất ăn và gặp nghệ sĩ',
          price: 1000000,
          quantity: 100,
          available: 100
        },
        {
          name: 'Standard',
          description: 'Vé tiêu chuẩn',
          price: 500000,
          quantity: 500,
          available: 500
        },
        {
          name: 'Economy',
          description: 'Vé phổ thông',
          price: 300000,
          quantity: 400,
          available: 400
        }
      ]
    });

    const event2 = await Event.create({
      title: 'Tech Summit 2023',
      description: 'Hội nghị công nghệ lớn nhất năm với các diễn giả hàng đầu',
      images: ['tech_summit_1.jpg', 'tech_summit_2.jpg'],
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 ngày sau
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 1 ngày sau khi bắt đầu
      location: {
        venue: venue2._id,
        address: venue2.address,
        city: venue2.city,
        country: venue2.country,
        coordinates: {
          type: 'Point',
          coordinates: [105.7825, 21.0042] // [longitude, latitude]
        },
        location: {
          latitude: 21.0042,
          longitude: 105.7825
        }
      },
      category: ['Công nghệ', 'Hội thảo'],
      tags: ['AI', 'Blockchain', 'Cloud'],
      status: 'approved',
      visibility: 'public',
      organizer: eventOwner._id,
      capacity: 2000,
      availableSeats: 2000,
      ticketTypes: [
        {
          name: 'Early Bird',
          description: 'Vé mua sớm có ưu đãi',
          price: 1200000,
          quantity: 500,
          available: 500
        },
        {
          name: 'Regular',
          description: 'Vé thường',
          price: 1500000,
          quantity: 1500,
          available: 1500
        }
      ]
    });

    console.log(`Đã tạo ${await Event.countDocuments()} events`);

    // 4. Tạo bookings
    console.log('Tạo bookings...');
    const booking1 = await Booking.create({
      eventId: event1._id,
      userId: user1._id,
      tickets: [
        {
          ticketType: 'VIP',
          quantity: 2,
          unitPrice: 1000000,
          seats: [
            {
              section: 'A',
              row: '1',
              seatNumber: '5'
            },
            {
              section: 'A',
              row: '1',
              seatNumber: '6'
            }
          ]
        }
      ],
      totalAmount: 2000000,
      paymentStatus: 'completed',
      status: 'confirmed',
      purchasedAt: new Date()
    });

    const booking2 = await Booking.create({
      eventId: event2._id,
      userId: user2._id,
      tickets: [
        {
          ticketType: 'Early Bird',
          quantity: 1,
          unitPrice: 1200000,
          seats: [
            {
              section: 'B',
              row: '3',
              seatNumber: '10'
            }
          ]
        }
      ],
      totalAmount: 1200000,
      paymentStatus: 'completed',
      status: 'confirmed',
      purchasedAt: new Date()
    });

    console.log(`Đã tạo ${await Booking.countDocuments()} bookings`);

    // 5. Tạo tickets
    console.log('Tạo tickets...');
    const ticket1 = await Ticket.create({
      bookingId: booking1._id,
      eventId: event1._id,
      userId: user1._id,
      ticketType: 'VIP',
      seat: {
        section: 'A',
        row: '1',
        seatNumber: '5'
      },
      price: 1000000,
      isUsed: false
    });

    const ticket2 = await Ticket.create({
      bookingId: booking1._id,
      eventId: event1._id,
      userId: user1._id,
      ticketType: 'VIP',
      seat: {
        section: 'A',
        row: '1',
        seatNumber: '6'
      },
      price: 1000000,
      isUsed: false
    });

    const ticket3 = await Ticket.create({
      bookingId: booking2._id,
      eventId: event2._id,
      userId: user2._id,
      ticketType: 'Early Bird',
      seat: {
        section: 'B',
        row: '3',
        seatNumber: '10'
      },
      price: 1200000,
      isUsed: false
    });

    // Cập nhật ticketId trong booking
    await Booking.findByIdAndUpdate(booking1._id, {
      $set: {
        'tickets.0.ticketIds': [ticket1._id, ticket2._id]
      }
    });

    await Booking.findByIdAndUpdate(booking2._id, {
      $set: {
        'tickets.0.ticketIds': [ticket3._id]
      }
    });

    console.log(`Đã tạo ${await Ticket.countDocuments()} tickets`);

    // 6. Tạo payments
    console.log('Tạo payments...');
    const payment1 = await Payment.create({
      bookingId: booking1._id,
      userId: user1._id,
      amount: 2000000,
      currency: 'VND',
      paymentMethod: {
        type: 'credit_card',
        details: {
          lastFour: '4242',
          cardType: 'Visa'
        }
      },
      status: 'completed',
      transactionId: 'tx_' + Math.random().toString(36).substr(2, 9),
      paymentGateway: 'stripe',
      paymentDate: new Date()
    });

    const payment2 = await Payment.create({
      bookingId: booking2._id,
      userId: user2._id,
      amount: 1200000,
      currency: 'VND',
      paymentMethod: {
        type: 'momo',
        details: {
          phone: '09xxxxxxxx'
        }
      },
      status: 'completed',
      transactionId: 'tx_' + Math.random().toString(36).substr(2, 9),
      paymentGateway: 'momo',
      paymentDate: new Date()
    });

    // Cập nhật paymentId trong booking
    await Booking.findByIdAndUpdate(booking1._id, {
      paymentId: payment1._id
    });

    await Booking.findByIdAndUpdate(booking2._id, {
      paymentId: payment2._id
    });

    console.log(`Đã tạo ${await Payment.countDocuments()} payments`);

    // 7. Tạo reviews
    console.log('Tạo reviews...');
    const review1 = await Review.create({
      eventId: event1._id,
      userId: user1._id,
      rating: 5,
      comment: 'Sự kiện tuyệt vời, âm thanh và ánh sáng rất ấn tượng!',
      status: 'approved'
    });

    const review2 = await Review.create({
      eventId: event2._id,
      userId: user2._id,
      rating: 4,
      comment: 'Rất nhiều thông tin hữu ích, nhưng lịch trình hơi dài.',
      status: 'approved'
    });

    console.log(`Đã tạo ${await Review.countDocuments()} reviews`);

    // 8. Tạo posts
    console.log('Tạo posts...');
    const post1 = await Post.create({
      userId: user1._id,
      eventId: event1._id,
      title: 'Cảm nhận về đêm nhạc Trịnh',
      content: 'Tối qua tôi đã có cơ hội tham dự đêm nhạc Trịnh Công Sơn...',
      tags: ['trịnh công sơn', 'âm nhạc', 'review'],
      status: 'approved',
      visibility: 'public'
    });

    const post2 = await Post.create({
      userId: eventOwner._id,
      eventId: event2._id,
      title: 'Thông báo thay đổi địa điểm Tech Summit',
      content: 'Xin thông báo Tech Summit 2023 sẽ được tổ chức tại...',
      tags: ['tech summit', 'thông báo'],
      status: 'approved',
      visibility: 'public'
    });

    console.log(`Đã tạo ${await Post.countDocuments()} posts`);

    // 9. Tạo comments
    console.log('Tạo comments...');
    const comment1 = await Comment.create({
      postId: post1._id,
      userId: user2._id,
      content: 'Tôi cũng rất thích bài Diễm Xưa!',
      status: 'approved'
    });

    const comment2 = await Comment.create({
      postId: post1._id,
      userId: eventOwner._id,
      content: 'Cảm ơn bạn đã tham dự sự kiện của chúng tôi.',
      status: 'approved'
    });

    // Cập nhật comments trong post
    await Post.findByIdAndUpdate(post1._id, {
      $push: { comments: [comment1._id, comment2._id] }
    });

    console.log(`Đã tạo ${await Comment.countDocuments()} comments`);

    // 10. Tạo reports
    console.log('Tạo reports...');
    const report1 = await Report.create({
      reportType: 'comment',
      reportedId: comment1._id,
      reporterId: eventOwner._id,
      reason: 'Spam',
      description: 'Bình luận không liên quan đến nội dung bài viết',
      status: 'pending'
    });

    console.log(`Đã tạo ${await Report.countDocuments()} reports`);

    // 11. Tạo notifications
    console.log('Tạo notifications...');
    const notification1 = await Notification.create({
      userId: user1._id,
      type: 'booking_confirmation',
      title: 'Đặt vé thành công',
      message: 'Bạn đã đặt vé thành công cho sự kiện Đêm nhạc Trịnh Công Sơn',
      relatedTo: {
        type: 'booking',
        id: booking1._id
      },
      isRead: false
    });

    const notification2 = await Notification.create({
      userId: eventOwner._id,
      type: 'new_review',
      title: 'Có đánh giá mới',
      message: 'Sự kiện của bạn vừa nhận được đánh giá 5 sao',
      relatedTo: {
        type: 'review',
        id: review1._id
      },
      isRead: false
    });

    console.log(`Đã tạo ${await Notification.countDocuments()} notifications`);

    // 12. Tạo activity logs
    console.log('Tạo activity logs...');
    const activityLog1 = await ActivityLog.create({
      userId: user1._id,
      action: 'booking_created',
      entityType: 'booking',
      entityId: booking1._id,
      details: {
        event: event1.title,
        amount: 2000000
      },
      timestamp: new Date()
    });

    const activityLog2 = await ActivityLog.create({
      userId: user1._id,
      action: 'review_posted',
      entityType: 'review',
      entityId: review1._id,
      details: {
        event: event1.title,
        rating: 5
      },
      timestamp: new Date()
    });

    console.log(`Đã tạo ${await ActivityLog.countDocuments()} activity logs`);

    // 13. Tạo transactions
    console.log('Tạo transactions...');
    const transaction1 = await Transaction.create({
      eventId: event1._id,
      organizerId: eventOwner._id,
      bookingId: booking1._id,
      amount: 2000000,
      platformFee: 200000, // 10%
      organizerAmount: 1800000,
      type: 'sale',
      status: 'completed'
    });

    const transaction2 = await Transaction.create({
      eventId: event2._id,
      organizerId: eventOwner._id,
      bookingId: booking2._id,
      amount: 1200000,
      platformFee: 120000, // 10%
      organizerAmount: 1080000,
      type: 'sale',
      status: 'completed'
    });

    console.log(`Đã tạo ${await Transaction.countDocuments()} transactions`);

    console.log('\nTạo dữ liệu mẫu thành công!');
    console.log('\nTổng số bản ghi đã tạo:');
    console.log(`- Users: ${await User.countDocuments()}`);
    console.log(`- Venues: ${await Venue.countDocuments()}`);
    console.log(`- Events: ${await Event.countDocuments()}`);
    console.log(`- Bookings: ${await Booking.countDocuments()}`);
    console.log(`- Tickets: ${await Ticket.countDocuments()}`);
    console.log(`- Payments: ${await Payment.countDocuments()}`);
    console.log(`- Reviews: ${await Review.countDocuments()}`);
    console.log(`- Posts: ${await Post.countDocuments()}`);
    console.log(`- Comments: ${await Comment.countDocuments()}`);
    console.log(`- Reports: ${await Report.countDocuments()}`);
    console.log(`- Notifications: ${await Notification.countDocuments()}`);
    console.log(`- ActivityLogs: ${await ActivityLog.countDocuments()}`);
    console.log(`- Transactions: ${await Transaction.countDocuments()}`);

  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu mẫu:', error);
  } finally {
    // Đóng kết nối
    await mongoose.connection.close();
    console.log('Đã đóng kết nối MongoDB');
  }
}

// Chạy hàm tạo dữ liệu mẫu
seedDatabase();
