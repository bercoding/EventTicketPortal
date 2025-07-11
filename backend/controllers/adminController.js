const User = require('../models/User');
const Event = require('../models/Event');
const Post = require('../models/Post');
const Complaint = require('../models/Complaint');
const ViolationReport = require('../models/ViolationReport');
const OwnerRequest = require('../models/OwnerRequest');
const Ticket = require('../models/Ticket');

// Get all users with pagination and filters
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, role, search } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(filter);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Ban user
exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        isBanned: true,
        banReason: reason,
        bannedAt: new Date(),
        bannedBy: req.user.id
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User banned successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error banning user', error: error.message });
  }
};

// Unban user
exports.unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        isBanned: false,
        banReason: null,
        bannedAt: null,
        bannedBy: null
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User unbanned successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error unbanning user', error: error.message });
  }
};

// Approve event
exports.approveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findByIdAndUpdate(
      eventId,
      { 
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.user.id
      },
      { new: true }
    ).populate('organizer', 'username email fullName');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({ message: 'Event approved successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Error approving event', error: error.message });
  }
};

// Reject event
exports.rejectEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { reason } = req.body;
    
    const event = await Event.findByIdAndUpdate(
      eventId,
      { 
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: req.user.id,
        rejectionReason: reason
      },
      { new: true }
    ).populate('organizer', 'username email fullName');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({ message: 'Event rejected successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting event', error: error.message });
  }
};

// View event list
exports.getEvents = async (req, res) => {
  try {
    console.log('🔍 API getEvents được gọi với query:', req.query);
    
    const { page = 1, limit = 10, status, search } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('🔍 Tìm kiếm events với filter:', JSON.stringify(filter));
    
    try {
      const events = await Event.find(filter)
        .populate('organizer', 'username email fullName')
        .populate('ticketTypes')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      const total = await Event.countDocuments(filter);
      
      console.log(`🔍 Tìm thấy ${events.length} events`);
      
      if (req.query.returnFormat === 'array') {
        console.log('Trả về events dạng mảng');
        return res.json(events);
      }
      
      res.json({
        events,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (err) {
      console.error('🔴 Lỗi khi query database:', err);
      return res.status(500).json({ 
        message: 'Error querying events from database', 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  } catch (error) {
    console.error('🔴 Error fetching events:', error);
    res.status(500).json({ 
      message: 'Error fetching events', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all complaints
exports.getComplaints = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, priority } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    
    const complaints = await Complaint.find(filter)
      .populate('user', 'username email fullName')
      .populate('relatedEvent', 'title')
      .populate('relatedUser', 'username email fullName')
      .populate('resolvedBy', 'username email fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Complaint.countDocuments(filter);
    
    res.json({
      complaints,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
};

// Resolve user complaints
exports.resolveComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { resolution, note } = req.body;
    
    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { 
        status: 'resolved',
        resolution,
        resolutionNote: note,
        resolvedAt: new Date(),
        resolvedBy: req.user.id
      },
      { new: true }
    )
    .populate('user', 'username email fullName')
    .populate('relatedEvent', 'title')
    .populate('relatedUser', 'username email fullName')
    .populate('resolvedBy', 'username email fullName');
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    res.json({ message: 'Complaint resolved successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Error resolving complaint', error: error.message });
  }
};

// Get all posts for moderation
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = {};
    
    if (status) filter.moderationStatus = status;
    
    const posts = await Post.find(filter)
      .populate('author', 'username email fullName')
      .populate('moderatedBy', 'username email fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Post.countDocuments(filter);
    
    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
};

// Moderate posts
exports.moderatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { action, reason } = req.body; // action: 'approve', 'reject', 'flag'
    
    const post = await Post.findByIdAndUpdate(
      postId,
      { 
        moderationStatus: action,
        moderationReason: reason,
        moderatedAt: new Date(),
        moderatedBy: req.user.id
      },
      { new: true }
    ).populate('author', 'username email fullName');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json({ message: 'Post moderated successfully', post });
  } catch (error) {
    res.status(500).json({ message: 'Error moderating post', error: error.message });
  }
};

// Delete posts
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findByIdAndDelete(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post', error: error.message });
  }
};

// View violation reports
exports.getViolationReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    
    const reports = await ViolationReport.find(filter)
      .populate('reporter', 'username email fullName')
      .populate('reportedUser', 'username email fullName')
      .populate('resolvedBy', 'username email fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await ViolationReport.countDocuments(filter);
    
    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching violation reports', error: error.message });
  }
};

// Resolve violation report
exports.resolveViolationReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, reason } = req.body;
    
    const report = await ViolationReport.findByIdAndUpdate(
      reportId,
      { 
        status: 'resolved',
        resolution: action,
        resolutionReason: reason,
        resolvedAt: new Date(),
        resolvedBy: req.user.id
      },
      { new: true }
    )
    .populate('reporter', 'username email fullName')
    .populate('reportedUser', 'username email fullName')
    .populate('resolvedBy', 'username email fullName');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json({ message: 'Violation report resolved successfully', report });
  } catch (error) {
    res.status(500).json({ message: 'Error resolving violation report', error: error.message });
  }
};

// View revenue
exports.getRevenue = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = {
      status: 'completed',
      createdAt: {
        $gte: new Date(startDate || '2020-01-01'),
        $lte: new Date(endDate || new Date())
      }
    };
    
    const revenue = await Ticket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
          totalTickets: { $sum: 1 },
          averageTicketPrice: { $avg: '$price' }
        }
      }
    ]);
    
    const monthlyRevenue = await Ticket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$price' },
          tickets: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);
    
    const eventRevenue = await Ticket.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventInfo'
        }
      },
      { $unwind: '$eventInfo' },
      {
        $group: {
          _id: '$event',
          eventTitle: { $first: '$eventInfo.title' },
          revenue: { $sum: '$price' },
          tickets: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      totalRevenue: revenue[0] || { totalRevenue: 0, totalTickets: 0, averageTicketPrice: 0 },
      monthlyRevenue,
      topEvents: eventRevenue
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching revenue', error: error.message });
  }
};

// Get owner requests
exports.getOwnerRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    
    const requests = await OwnerRequest.find(filter)
      .populate('user', 'username email fullName')
      .populate('approvedBy', 'username email fullName')
      .populate('rejectedBy', 'username email fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await OwnerRequest.countDocuments(filter);
    
    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching owner requests', error: error.message });
  }
};

// Approve owner request
exports.approveOwnerRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await OwnerRequest.findById(requestId)
      .populate('user', 'username email fullName');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Update request status
    request.status = 'approved';
    request.approvedAt = new Date();
    request.approvedBy = req.user.id;
    await request.save();
    
    // Update user role to owner
    await User.findByIdAndUpdate(request.user._id, { role: 'owner' });
    
    res.json({ message: 'Owner request approved successfully', request });
  } catch (error) {
    res.status(500).json({ message: 'Error approving owner request', error: error.message });
  }
};

// Reject owner request
exports.rejectOwnerRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    
    const request = await OwnerRequest.findByIdAndUpdate(
      requestId,
      { 
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: req.user.id,
        rejectionReason: reason
      },
      { new: true }
    ).populate('user', 'username email fullName');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    res.json({ message: 'Owner request rejected successfully', request });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting owner request', error: error.message });
  }
};

// Get admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsersPromise = User.countDocuments();
    const totalEventsPromise = Event.countDocuments();
    const pendingOwnerRequestsPromise = OwnerRequest.countDocuments({ status: 'pending' });
    const pendingComplaintsPromise = Complaint.countDocuments({ status: 'pending' });
    const pendingEventsPromise = Event.countDocuments({ status: 'pending' });
    const pendingReportsPromise = ViolationReport.countDocuments({ status: 'pending' });
    const pendingPostsPromise = Post.countDocuments({ moderationStatus: 'pending' });

    const [
        totalUsers,
        totalEvents,
        pendingOwnerRequests,
        pendingComplaints,
        pendingEvents,
        pendingReports,
        pendingPosts
    ] = await Promise.all([
        totalUsersPromise,
        totalEventsPromise,
        pendingOwnerRequestsPromise,
        pendingComplaintsPromise,
        pendingEventsPromise,
        pendingReportsPromise,
        pendingPostsPromise
    ]);

    res.json({
        totalUsers,
        totalEvents,
        pendingOwnerRequests,
        pendingComplaints,
        pendingEvents,
        pendingReports,
        pendingPosts,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

// Thêm API endpoint debug để lấy danh sách sự kiện
exports.getDebugEvents = async (req, res) => {
  try {
    // Lấy tất cả sự kiện từ database
    const events = await Event.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('_id title startDate endDate status');

    // Nếu không có sự kiện, tạo một số sự kiện mẫu
    if (events.length === 0) {
      const mockEvents = [
        {
          id: '685ab48cbd98a1cf388b61ae',
          title: '111111',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'upcoming'
        },
        {
          id: '685ab765bd98a1cf388b6322',
          title: '111',
          startDate: new Date(),
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          status: 'upcoming'
        },
        {
          id: '685b54cbae2998b5b694d287',
          title: 'Concert Nhạc 2025',
          startDate: new Date(),
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: 'upcoming'
        },
        {
          id: '685b589c56c91bcc1eede28d',
          title: 'Rap Việt 2025',
          startDate: new Date(),
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          status: 'upcoming'
        },
        {
          id: '685b6ebc51efa980bf282fc5',
          title: 'Lễ hội âm nhạc mùa hè 2025',
          startDate: new Date(),
          endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          status: 'upcoming'
        }
      ];

      res.json({
        success: true,
        events: mockEvents
      });
    } else {
      // Format events data
      const formattedEvents = events.map(event => ({
        id: event._id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        status: event.status
      }));

      res.json({
        success: true,
        events: formattedEvents
      });
    }
  } catch (error) {
    console.error('Error fetching debug events:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách sự kiện debug',
      error: error.message
    });
  }
};

// Lấy danh sách sự kiện thật cho admin
exports.getAllEvents = async (req, res) => {
  try {
    // Lấy tất cả sự kiện từ database
    const events = await Event.find()
      .sort({ createdAt: -1 })
      .select('_id title startDate endDate status');

    // Format events data
    const formattedEvents = events.map(event => ({
      id: event._id,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      status: event.status
    }));

    res.json({
      events: formattedEvents
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách sự kiện',
      error: error.message
    });
  }
};