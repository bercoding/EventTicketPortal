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
    const { username, email } = req.body; // Thêm tham số để hỗ trợ tìm kiếm theo username/email
    
    console.log('🔓 Đang xử lý unban cho ID/username/email:', id, username, email);
    
    let user;
    
    // Tìm theo ID nếu có giá trị hợp lệ
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('🔍 Tìm user theo ID:', id);
      user = await User.findById(id);
    }
    
    // Nếu không tìm thấy theo ID, thử tìm theo username
    if (!user && username) {
      console.log('🔍 Tìm user theo username:', username);
      user = await User.findOne({ username });
    }
    
    // Nếu vẫn không tìm thấy, thử tìm theo email
    if (!user && email) {
      console.log('🔍 Tìm user theo email:', email);
      user = await User.findOne({ email });
    }
    
    // Nếu không tìm thấy user
    if (!user) {
      console.log('❌ Không tìm thấy user với ID/username/email:', id, username, email);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('✅ Đã tìm thấy user:', user.username, user._id);
    
    // Chỉ update nếu user đang bị ban
    if (user.status !== 'banned') {
      console.log('⚠️ User không trong trạng thái banned:', user.status);
      return res.status(400).json({ 
        message: 'User is not banned',
        currentStatus: user.status
      });
    }
    
    // Update trạng thái user
    user.status = 'active';
    user.banReason = null;
    user.banDate = null;
    user.banExpiry = null;
    user.bannedBy = null;
    
    await user.save();
    
    console.log('✅ Đã mở khóa user thành công:', user.username);
    
    res.json({ 
      message: 'User unbanned successfully', 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        status: user.status
      } 
    });
  } catch (error) {
    console.error('❌ Error unbanning user:', error);
    res.status(500).json({ message: 'Error unbanning user', error: error.message });
  }
};

// Unban user by email
exports.unbanUserByEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    console.log('🔓 Đang tìm và mở khóa tài khoản với email:', email);
    
    // Tìm user theo email
    const user = await User.findOne({ email });
    
    // Nếu không tìm thấy user
    if (!user) {
      console.log('❌ Không tìm thấy user với email:', email);
      return res.status(404).json({ message: `User with email ${email} not found` });
    }
    
    console.log('✅ Đã tìm thấy user:', user.username, user._id, 'Status:', user.status);
    
    // Kiểm tra nếu tài khoản đã được kích hoạt
    if (user.status === 'active') {
      console.log('ℹ️ Tài khoản đã đang hoạt động:', user.email);
      // Trả về thành công ngay cả khi tài khoản đã active
      return res.json({ 
        success: true,
        message: 'User is already active',
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          status: user.status
        }
      });
    }
    
    // Update trạng thái user nếu đang bị khóa
    user.status = 'active';
    user.banReason = null;
    user.banDate = null;
    user.banExpiry = null;
    user.bannedBy = null;
    
    await user.save();
    
    console.log('✅ Đã mở khóa tài khoản thành công:', user.email);
    
    // Gửi thông báo đến user (nếu có)
    const io = req.app.get('io');
    if (io) {
      // Tạo thông báo
      const notification = await Notification.create({
        userId: user._id,
        type: 'account_unbanned',
        title: 'Tài khoản của bạn đã được mở khóa',
        message: 'Kháng cáo của bạn đã được chấp nhận và tài khoản của bạn đã được mở khóa.',
      });
      
      // Gửi thông báo qua socket
      io.to(user._id.toString()).emit('new_notification', notification);
    }
    
    res.json({ 
      success: true,
      message: 'User unbanned successfully', 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        status: user.status
      } 
    });
  } catch (error) {
    console.error('❌ Error unbanning user by email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error unbanning user', 
      error: error.message 
    });
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

    // --- Create Notification for each organizer ---
    if (event.organizers && event.organizers.length > 0) {
        const io = req.app.get('io');
        for (const organizer of event.organizers) {
            const notification = await Notification.create({
                userId: organizer._id,
                type: 'event_rejected',
                title: 'Sự kiện đã bị từ chối',
                message: `Sự kiện "<strong>${event.title}</strong>" của bạn đã bị từ chối. Lý do: ${reason}`,
                relatedTo: {
                  type: 'event',
                  id: event._id
                }
            });
            // --- Emit socket event ---
            io.to(organizer._id.toString()).emit('new_notification', notification);
        }
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

// Get all complaints with pagination and filtering
exports.getComplaints = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const type = req.query.type;
    const searchTerm = req.query.search;

    console.log('📊 Đang lấy danh sách khiếu nại với tham số:', { page, limit, status, type, searchTerm });

    let query = {};
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Add type filter if provided
    if (type && type !== 'all') {
      // Ban appeals filter
      if (type === 'ban-appeals') {
        query.$or = [
          { subject: { $regex: 'kháng cáo', $options: 'i' } },
          { subject: { $regex: 'ban', $options: 'i' } },
          { subject: { $regex: 'khóa', $options: 'i' } },
          { description: { $regex: 'kháng cáo', $options: 'i' } }
        ];
      }
      // Event reports filter
      else if (type === 'event-reports') {
        query.$or = [
          { subject: { $regex: 'sự kiện', $options: 'i' } },
          { subject: { $regex: 'event', $options: 'i' } }
        ];
      }
      // Other types as needed
    }
    
    // Add search filter if provided
    if (searchTerm) {
      query.$or = [
        { subject: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Count total complaints with filters
    const totalComplaints = await Complaint.countDocuments(query);
    
    // Get complaints with pagination
    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'user',
        select: 'username email avatar status'
      })
      .populate({
        path: 'relatedEvent',
        select: 'title'
      })
      .populate({
        path: 'relatedUser',
        select: 'username email status'
      })
      .lean();
      
    // Tìm kiếm thêm thông tin người dùng bị ban trong các khiếu nại liên quan đến kháng cáo
    const enhancedComplaints = await Promise.all(complaints.map(async (complaint) => {
      // Chỉ xử lý cho các khiếu nại liên quan đến kháng cáo ban
      if (complaint.subject && (
          complaint.subject.toLowerCase().includes('kháng cáo') || 
          complaint.subject.toLowerCase().includes('ban') ||
          complaint.subject.toLowerCase().includes('khóa')
        )) {
        
        // Tìm email trong nội dung
        const description = complaint.description || '';
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = description.match(emailRegex) || [];
        
        if (emails.length > 0) {
          // Tìm thông tin người dùng qua email
          const bannedUser = await User.findOne({ email: emails[0] }).lean().select('username email status banReason');
          if (bannedUser) {
            complaint.bannedUser = bannedUser;
          }
        }
      }
      
      return complaint;
    }));

    // Calculate total pages
    const totalPages = Math.ceil(totalComplaints / limit);

    console.log(`✅ Đã tìm thấy ${totalComplaints} khiếu nại, trang ${page}/${totalPages}`);

    // Return complaints with pagination info
    res.json({
      complaints: enhancedComplaints,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalComplaints,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('❌ Error getting complaints:', error);
    res.status(500).json({ message: 'Error getting complaints', error: error.message });
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