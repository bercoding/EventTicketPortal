const RefundRequest = require('../models/RefundRequest');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Tạo yêu cầu hoàn tiền vé
exports.createRefundRequest = async (req, res) => {
  try {
    const { bookingId, reason, bankInfo } = req.body;
    const userId = req.user.id;
    
    let booking;
    let event;
    let ticketInfo;

    // Kiểm tra xem bookingId có thể là ticketId không
    const isTicketId = await Ticket.findOne({ _id: bookingId, user: userId });
    
    if (isTicketId) {
      // Nếu đây là ticket ID
      ticketInfo = isTicketId;
      
      // Lấy thông tin event từ ticket
      event = await Event.findById(ticketInfo.event);
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin sự kiện cho vé này'
        });
      }
      
      // Tìm booking liên quan đến vé này
      booking = await Booking.findOne({ 
        user: userId,
        tickets: { $elemMatch: { $eq: bookingId } }
      });
      
      // Nếu không tìm thấy booking, tạo một booking ảo để xử lý
      if (!booking) {
        booking = {
          _id: bookingId, // Sử dụng ticketId làm bookingId
          user: userId,
          totalAmount: ticketInfo.price,
          status: 'confirmed',
          event: event._id,
          isVirtualBooking: true // Đánh dấu đây là booking ảo
        };
      }
    } else {
      // Kiểm tra theo bookingId truyền thống
      booking = await Booking.findOne({ _id: bookingId, user: userId })
        .populate('event');
      
      if (!booking) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy thông tin đặt vé hoặc bạn không phải chủ sở hữu vé này' 
        });
      }
      
      event = booking.event;
    }

    // Kiểm tra xem booking có thể được hoàn tiền không
    if (booking.status === 'cancelled' || booking.status === 'refunded' || booking.status === 'refund_requested') {
      return res.status(400).json({ 
        success: false, 
        message: 'Đơn đặt vé đã bị hủy hoặc đã được hoàn tiền trước đó' 
      });
    }

    // Kiểm tra nếu sự kiện đã diễn ra
    if (new Date(event.startDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Không thể trả vé cho sự kiện đã diễn ra'
      });
    }

    // Tính toán số tiền hoàn (75% giá trị đơn hàng)
    const totalAmount = booking.totalAmount || (ticketInfo ? ticketInfo.price : 0);
    const refundAmount = Math.floor(totalAmount * 0.75);

    // Tạo yêu cầu hoàn tiền
    const refundRequest = new RefundRequest({
      user: userId,
      booking: booking._id,
      event: event._id,
      reason,
      amount: totalAmount,
      refundAmount,
      bankInfo,
      status: 'pending'
    });

    await refundRequest.save();

    // Cập nhật trạng thái booking nếu đây là booking thực
    if (!booking.isVirtualBooking) {
      booking.status = 'refund_requested';
      await booking.save();
    }
    
    // Cập nhật trạng thái vé nếu đây là ticket ID
    if (ticketInfo) {
      ticketInfo.status = 'refund_requested';
      await ticketInfo.save();
    }

    // Thông báo cho admin
    await Notification.create({
      userId: null, // Gửi cho tất cả admin
      type: 'refund_request',
      title: 'Yêu cầu hoàn tiền mới',
      message: `Có yêu cầu hoàn tiền mới cho ${event.title}`,
      isForAdmin: true,
      relatedTo: {
        type: 'refund',
        id: refundRequest._id
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Yêu cầu hoàn tiền đã được ghi nhận và đang chờ xử lý',
      refundRequest
    });
  } catch (error) {
    console.error('Error creating refund request:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi tạo yêu cầu hoàn tiền',
      error: error.message
    });
  }
};

// Lấy danh sách yêu cầu hoàn tiền của người dùng
exports.getUserRefundRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const refundRequests = await RefundRequest.find({ user: userId })
      .populate('booking', 'bookingCode totalAmount')
      .populate('event', 'title startDate images')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      refundRequests
    });
  } catch (error) {
    console.error('Error fetching user refund requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách yêu cầu hoàn tiền',
      error: error.message
    });
  }
};

// [ADMIN] Lấy danh sách tất cả yêu cầu hoàn tiền
exports.getAllRefundRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    const refundRequests = await RefundRequest.find(query)
      .populate('user', 'username email avatar')
      .populate('booking', 'bookingCode totalAmount createdAt')
      .populate('event', 'title startDate images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await RefundRequest.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      refundRequests,
      pagination: {
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all refund requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách yêu cầu hoàn tiền',
      error: error.message
    });
  }
};

// [ADMIN] Xử lý yêu cầu hoàn tiền
exports.processRefundRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = req.user.id;
    
    if (!['processing', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }
    
    const refundRequest = await RefundRequest.findById(id);
    
    if (!refundRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu hoàn tiền'
      });
    }
    
    // Cập nhật trạng thái
    refundRequest.status = status;
    refundRequest.adminNotes = adminNotes || refundRequest.adminNotes;
    
    if (status === 'completed') {
      refundRequest.completedAt = new Date();
      refundRequest.completedBy = adminId;
      
      // Cập nhật trạng thái booking thành đã hoàn tiền
      await Booking.findByIdAndUpdate(refundRequest.booking, {
        status: 'refunded'
      });
      
      // Gửi thông báo cho người dùng
      await Notification.create({
        userId: refundRequest.user,
        type: 'refund_completed',
        title: 'Hoàn tiền thành công',
        message: `Yêu cầu hoàn tiền của bạn đã được xử lý. Số tiền ${refundRequest.refundAmount.toLocaleString('vi-VN')}đ đã được chuyển về tài khoản của bạn.`,
        relatedTo: {
          type: 'refund',
          id: refundRequest._id
        }
      });
    } else if (status === 'rejected') {
      refundRequest.rejectedAt = new Date();
      refundRequest.rejectedBy = adminId;
      refundRequest.rejectionReason = req.body.rejectionReason;
      
      // Cập nhật trạng thái booking về active
      await Booking.findByIdAndUpdate(refundRequest.booking, {
        status: 'confirmed'
      });
      
      // Gửi thông báo cho người dùng
      await Notification.create({
        userId: refundRequest.user,
        type: 'refund_rejected',
        title: 'Yêu cầu hoàn tiền bị từ chối',
        message: `Yêu cầu hoàn tiền của bạn đã bị từ chối. Lý do: ${req.body.rejectionReason || 'Không đáp ứng điều kiện hoàn tiền'}`,
        relatedTo: {
          type: 'refund',
          id: refundRequest._id
        }
      });
    }
    
    await refundRequest.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái yêu cầu hoàn tiền thành công',
      refundRequest
    });
  } catch (error) {
    console.error('Error processing refund request:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xử lý yêu cầu hoàn tiền',
      error: error.message
    });
  }
}; 