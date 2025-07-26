const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Review = require('../models/Review');

// Lấy thống kê tổng quan cho owner
const getOwnerStatistics = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { timeRange = 'month' } = req.query;

    // Tính toán thời gian dựa trên timeRange
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Lấy tất cả sự kiện của owner
    const events = await Event.find({ 
      organizers: ownerId,
      createdAt: { $gte: startDate }
    });
    
    console.log('🔍 Owner Statistics Debug:');
    console.log('👤 Owner ID:', ownerId);
    console.log('📅 Time range:', timeRange, 'from', startDate);
    console.log('🎭 Events found:', events.length);
    console.log('🎭 Event IDs:', events.map(e => e._id));

    // Lấy tất cả payment liên quan đến sự kiện của owner
    const eventIds = events.map(event => event._id);
    const payments = await Payment.find({
      event: { $in: eventIds },
      status: { $in: ['success', 'completed'] },
      createdAt: { $gte: startDate }
    }).populate('user', 'username email');
    
    console.log('💰 Payments found:', payments.length);
    console.log('💰 Payment statuses:', payments.map(p => ({ id: p._id, status: p.status, amount: p.totalAmount })));

    // Lấy tất cả booking liên quan đến sự kiện của owner
    const bookings = await Booking.find({
      event: { $in: eventIds },
      createdAt: { $gte: startDate }
    });

    // Lấy reviews cho sự kiện của owner
    const reviews = await Review.find({
      event: { $in: eventIds },
      createdAt: { $gte: startDate }
    });

    // Tính toán thống kê
    const totalRevenue = payments.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0);
    const totalEvents = events.length;
    const totalTickets = payments.reduce((sum, payment) => {
      if (payment.bookingType === 'seating') {
        return sum + (payment.selectedSeats?.length || 0);
      } else {
        return sum + payment.selectedTickets?.reduce((ticketSum, ticket) => ticketSum + (ticket.quantity || 0), 0) || 0;
      }
    }, 0);
    const totalViews = events.reduce((sum, event) => sum + (event.views || 0), 0);
    
    console.log('📊 Calculated stats:');
    console.log('💰 Total Revenue:', totalRevenue);
    console.log('🎭 Total Events:', totalEvents);
    console.log('🎫 Total Tickets:', totalTickets);
    console.log('👁️ Total Views:', totalViews);

    // Tính doanh thu theo tháng (12 tháng gần nhất)
    const monthlyRevenue = [];
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthPayments = payments.filter(payment => 
        payment.createdAt >= monthStart && payment.createdAt <= monthEnd
      );
      
      const monthRevenue = monthPayments.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0);
      monthlyRevenue.push(monthRevenue / 1000000); // Chuyển về triệu VNĐ
      months.push(`T${now.getMonth() - i + 1}`);
    }

    // Tính sự kiện theo danh mục
    const categoryStats = {};
    events.forEach(event => {
      const category = event.category || 'Khác';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    const categoryLabels = Object.keys(categoryStats);
    const categoryData = Object.values(categoryStats);

    // Top sự kiện theo doanh thu
    const eventRevenue = {};
    payments.forEach(payment => {
      const eventId = payment.event?.toString();
      if (eventId) {
        eventRevenue[eventId] = (eventRevenue[eventId] || 0) + (payment.totalAmount || 0);
      }
    });

    const topEvents = await Promise.all(
      Object.entries(eventRevenue)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(async ([eventId, revenue]) => {
          const event = await Event.findById(eventId);
          if (!event) return null;
          
                     const eventPayments = payments.filter(p => p.event.toString() === eventId);
           const tickets = eventPayments.reduce((sum, payment) => {
             if (payment.bookingType === 'seating') {
               return sum + (payment.selectedSeats?.length || 0);
             } else {
               return sum + payment.selectedTickets?.reduce((ticketSum, ticket) => ticketSum + (ticket.quantity || 0), 0) || 0;
             }
           }, 0);
           
           // Lấy thông tin người mua vé
           const buyers = [];
           const buyerMap = new Map();
           
                       eventPayments.forEach(payment => {
              const userId = payment.user._id.toString();
              const userName = payment.user?.username || payment.user?.email || `User ${userId.slice(-4)}`;
              
              let ticketCount = 0;
              if (payment.bookingType === 'seating') {
                ticketCount = payment.selectedSeats?.length || 0;
              } else {
                ticketCount = payment.selectedTickets?.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0) || 0;
              }
              
              if (buyerMap.has(userId)) {
                buyerMap.get(userId).tickets += ticketCount;
              } else {
                buyerMap.set(userId, {
                  name: userName,
                  tickets: ticketCount
                });
              }
            });
           
           // Chuyển Map thành array và sắp xếp theo số vé giảm dần
           buyerMap.forEach((buyer, userId) => {
             buyers.push(buyer);
           });
           buyers.sort((a, b) => b.tickets - a.tickets);
           
           return {
             id: event._id,
             name: event.title,
             revenue: revenue,
             tickets: tickets,
             views: event.views || 0,
             buyers: buyers.slice(0, 10) // Chỉ lấy top 10 người mua nhiều nhất
           };
        })
    );

    // Tính growth rate (so với tháng trước)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const previousMonthPayments = payments.filter(payment => 
      payment.createdAt >= previousMonthStart && payment.createdAt <= previousMonthEnd
    );
    const previousMonthRevenue = previousMonthPayments.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0);
    
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthPayments = payments.filter(payment => 
      payment.createdAt >= currentMonthStart
    );
    const currentMonthRevenue = currentMonthPayments.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0);
    
    const revenueGrowth = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;

    // Tính events growth
    const previousMonthEvents = events.filter(event => 
      event.createdAt >= previousMonthStart && event.createdAt <= previousMonthEnd
    ).length;
    const currentMonthEvents = events.filter(event => 
      event.createdAt >= currentMonthStart
    ).length;
    
    const eventsGrowth = previousMonthEvents > 0 
      ? ((currentMonthEvents - previousMonthEvents) / previousMonthEvents) * 100 
      : 0;

    // Thống kê khách hàng
    const uniqueCustomers = new Set(payments.map(payment => payment.user.toString())).size;
    const newCustomers = payments.filter(payment => 
      payment.createdAt >= currentMonthStart
    ).length;

    // Hoạt động gần đây
    const recentActivities = [];
    
    // Sự kiện mới được tạo
    const recentEvents = events
      .filter(event => event.createdAt >= new Date(Date.now() - 24 * 60 * 60 * 1000))
      .slice(0, 3);
    
    recentEvents.forEach(event => {
      recentActivities.push({
        type: 'event_created',
        message: `Sự kiện "${event.title}" đã được tạo`,
        time: event.createdAt
      });
    });

    // Vé mới được bán
    const recentPayments = payments
      .filter(payment => payment.createdAt >= new Date(Date.now() - 24 * 60 * 60 * 1000))
      .slice(0, 3);
    
    recentPayments.forEach(payment => {
      const event = events.find(e => e._id.toString() === payment.event.toString());
      if (event) {
        const ticketCount = payment.bookingType === 'seating' 
          ? (payment.selectedSeats?.length || 0)
          : payment.selectedTickets?.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0) || 0;
        
        recentActivities.push({
          type: 'ticket_sold',
          message: `Đã bán ${ticketCount} vé cho "${event.title}"`,
          time: payment.createdAt
        });
      }
    });

    // Reviews mới
    const recentReviews = reviews
      .filter(review => review.createdAt >= new Date(Date.now() - 24 * 60 * 60 * 1000))
      .slice(0, 3);
    
    recentReviews.forEach(review => {
      const event = events.find(e => e._id.toString() === review.event.toString());
      if (event) {
        recentActivities.push({
          type: 'review_received',
          message: `Nhận được đánh giá mới cho "${event.title}"`,
          time: review.createdAt
        });
      }
    });

    // Sắp xếp theo thời gian
    recentActivities.sort((a, b) => b.time - a.time);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalEvents,
        totalTickets,
        totalViews,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        eventsGrowth: Math.round(eventsGrowth * 100) / 100,
        monthlyRevenue,
        months,
        categoryLabels,
        categoryData,
        topEvents: topEvents.filter(Boolean),
        uniqueCustomers,
        newCustomers,
        recentActivities: recentActivities.slice(0, 5)
      }
    });

  } catch (error) {
    console.error('Error fetching owner statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu thống kê'
    });
  }
};

module.exports = {
  getOwnerStatistics
}; 