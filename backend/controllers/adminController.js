const User = require('../models/User');
const Event = require('../models/Event');
const Post = require('../models/Post');
const Complaint = require('../models/Complaint');
const ViolationReport = require('../models/ViolationReport');
const OwnerRequest = require('../models/OwnerRequest');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification'); // Import Notification model

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
    const { id: userId } = req.params;
    const { reason } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        status: 'banned',
        banReason: reason,
        banDate: new Date(),
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
    const { id } = req.params;
    
    const user = await User.findByIdAndUpdate(
      id,
      { 
        status: 'active',
        banReason: null,
        banDate: null,
        banExpiry: null,
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
    ).populate('organizers', 'username email fullName');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // --- Create Notification for each organizer ---
    if (event.organizers && event.organizers.length > 0) {
        const io = req.app.get('io');
        for (const organizer of event.organizers) {
            const notification = await Notification.create({
                userId: organizer._id,
                type: 'event_approved',
                title: 'Sự kiện đã được duyệt',
                message: `Sự kiện "<strong>${event.title}</strong>" của bạn đã được duyệt và hiện đã được công khai.`,
                relatedTo: {
                  type: 'event',
                  id: event._id
                }
            });
            // --- Emit socket event ---
            io.to(organizer._id.toString()).emit('new_notification', notification);
        }
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
    ).populate('organizers', 'username email fullName');
    
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
    const { page = 1, limit = 10, status, search } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const events = await Event.find(filter)
      .populate('organizers', 'username email fullName')
      .populate('ticketTypes') // Thêm dòng này để lấy thông tin vé
      .populate('location.venue', 'name address') // Thêm dòng này để lấy thông tin địa điểm
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Event.countDocuments(filter);
    
    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
};

// Get all complaints
exports.getComplaints = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, priority, subject } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    
    // Thêm lọc theo subject cho kháng cáo ban
    if (subject) {
      filter.subject = { $regex: subject, $options: 'i' };
    }
    
    console.log('🔍 Complaints filter:', filter);
    
    const complaints = await Complaint.find(filter)
      .populate('user', 'username email fullName')
      .populate('relatedEvent', 'title')
      .populate('relatedUser', 'username email fullName')
      .populate('resolvedBy', 'username email fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Complaint.countDocuments(filter);
    
    console.log(`📊 Found ${complaints.length}/${total} complaints`);
    
    res.json({
      complaints,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('❌ Error fetching complaints:', error);
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
};

// Resolve user complaints
exports.resolveComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, note } = req.body;
    
    console.log('🔧 Resolving complaint:', id, 'with resolution:', resolution);
    
    const complaint = await Complaint.findByIdAndUpdate(
      id,
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
      console.log('❌ Complaint not found:', id);
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    console.log('✅ Complaint resolved successfully:', id);
    
    res.json({ message: 'Complaint resolved successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Error resolving complaint', error: error.message });
  }
};

// Get all posts for moderation
exports.getPosts = async (req, res) => {
  try {
    console.log('🔍 Getting admin posts with query:', req.query);
    const { page = 1, limit = 10, status, search } = req.query;
    const filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('🔍 Using filter:', filter);
    
    // Populate author thay vì author từ userId
    const posts = await Post.find(filter)
      .populate({
        path: 'userId',
        select: 'username email fullName',
        model: 'User',
        as: 'author'
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    // Map lại kết quả để cấu trúc phù hợp với frontend
    const mappedPosts = posts.map(post => {
      return {
        ...post.toObject(),
        author: post.userId,
        _id: post._id
      };
    });
    
    const total = await Post.countDocuments(filter);
    
    console.log(`📊 Found ${mappedPosts.length}/${total} posts`);
    
    res.json({
      posts: mappedPosts,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('❌ Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
};

// Moderate posts
exports.moderatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // status: 'approved', 'rejected', 'pending'
    
    console.log(`🔍 Moderating post ${id} with status: ${status}, reason: ${reason}`);
    
    const post = await Post.findByIdAndUpdate(
      id,
      { 
        status: status,
        moderationReason: reason,
        moderatedAt: new Date(),
        moderatedBy: req.user.id
      },
      { new: true }
    ).populate('userId', 'username email fullName');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const mappedPost = {
      ...post.toObject(),
      author: post.userId
    };

    // --- Gửi notification khi duyệt bài viết ---
    if (status === 'approved' && post.userId) {
      const Notification = require('../models/Notification');
      const notification = await Notification.create({
        userId: post.userId._id || post.userId,
        type: 'post_approved',
        title: 'Bài viết đã được duyệt',
        message: `Bài viết của bạn "${post.title || ''}" đã được duyệt và hiển thị trên diễn đàn.`,
        relatedTo: {
          type: 'post',
          id: post._id
        }
      });
      // Emit socket event nếu có socket.io
      const io = req.app.get('io');
      if (io) {
        io.to(post.userId._id ? post.userId._id.toString() : post.userId.toString()).emit('new_notification', notification);
        // Emit cho tất cả client để forum realtime
        io.emit('post_approved', { postId: post._id });
      }
    }
    // --- End notification ---
    
    res.json({ message: 'Post moderated successfully', post: mappedPost });
  } catch (error) {
    console.error('❌ Error moderating post:', error);
    res.status(500).json({ message: 'Error moderating post', error: error.message });
  }
};

// Delete posts
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting post with ID: ${id}`);
    
    const post = await Post.findByIdAndDelete(id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting post:', error);
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
    
    console.log('📊 Fetching revenue from', startDate, 'to', endDate);
    
    const matchStage = {
      status: { $in: ['active', 'cancelled', 'returned'] },  // Tính vé đã bán (active), đã hủy (cancelled) và đã hoàn trả (returned)
      createdAt: {
        $gte: new Date(startDate || '2020-01-01'),
        $lte: new Date(endDate || new Date())
      }
    };
    
    console.log('🔍 Using match criteria:', JSON.stringify(matchStage));
    
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
    const { id } = req.params;
    const request = await OwnerRequest.findById(id)
      .populate('user', 'username email fullName idVerification');
      
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Kiểm tra xác thực CCCD của người dùng
    const user = await User.findById(request.user._id);
    if (!user.idVerification || !user.idVerification.verified) {
      return res.status(400).json({ 
        message: 'Người dùng chưa xác thực CCCD',
        idVerificationStatus: user.idVerification || { verified: false },
        requiredAction: 'verify_id_card'
      });
    }
    
    // Update request status
    request.status = 'approved';
    request.approvedAt = new Date();
    request.approvedBy = req.user.id;
    await request.save();
    
    // Update user role to event_owner
    await User.findByIdAndUpdate(request.user._id, { role: 'event_owner' });
    
    res.json({ 
      message: 'Owner request approved successfully', 
      request,
      idVerification: {
        verified: true,
        idNumber: user.idVerification.idNumber,
        name: user.idVerification.idFullName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error approving owner request', error: error.message });
  }
};

// Reject owner request
exports.rejectOwnerRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const request = await OwnerRequest.findByIdAndUpdate(
      id,
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