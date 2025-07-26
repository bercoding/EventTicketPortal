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
    console.log('📝 POST /api/refunds/requests');
    console.log('🔍 REQUEST BODY:', req.body);
    console.log('🔍 REQUEST USER:', req.user);
    
    const { bookingId, reason, bankInfo } = req.body;
    const userId = req.user.id;
    
    if (!bookingId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu thông tin bookingId' 
      });
    }

    if (!reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng nhập lý do trả vé' 
      });
    }

    if (!bankInfo || !bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolderName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng nhập đầy đủ thông tin ngân hàng' 
      });
    }
    
    let booking;
    let event;
    let ticketInfo;

    console.log('🔍 Looking for ticket/booking with ID:', bookingId);

    try {
      // Kiểm tra xem bookingId có thể là ticketId không
      const isTicketId = await Ticket.findOne({ _id: bookingId, user: userId });
      
      if (isTicketId) {
        console.log('✅ Found ticket:', isTicketId._id);
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
        
        console.log('✅ Found event:', event._id, event.title);
        
        // Tìm booking liên quan đến vé này - FIX: Không dùng $elemMatch vì có thể gây lỗi
        // Thay đổi cách tìm booking
        const bookings = await Booking.find({ user: userId });
        booking = bookings.find(b => 
          b.tickets && Array.isArray(b.tickets) && 
          b.tickets.some(t => t.toString() === bookingId.toString())
        );
        
        console.log('🔍 Related booking found:', booking ? booking._id : 'Not found');
        
        // Nếu không tìm thấy booking, tạo một booking ảo để xử lý
        if (!booking) {
          console.log('⚠️ No booking found, creating virtual booking');
          booking = {
            _id: new mongoose.Types.ObjectId(), // Tạo ID mới cho virtual booking
            user: userId,
            totalAmount: ticketInfo.price,
            status: 'confirmed',
            event: event._id,
            isVirtualBooking: true // Đánh dấu đây là booking ảo
          };
          console.log('🔧 Created virtual booking with ID:', booking._id);
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
        console.log('✅ Found booking and event:', booking._id, event._id);
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

      console.log('💰 Total amount:', totalAmount, 'Refund amount:', refundAmount);
      console.log('🏦 Bank info:', bankInfo);

      // Tạo yêu cầu hoàn tiền
      const refundRequestData = {
        user: userId,
        booking: booking._id,
        event: event._id,
        reason,
        amount: totalAmount,
        refundAmount,
        bankInfo: {
          bankName: bankInfo.bankName,
          accountNumber: bankInfo.accountNumber,
          accountHolderName: bankInfo.accountHolderName,
          branch: bankInfo.branch || ''
        },
        status: 'pending'
      };

      console.log('📝 Creating refund request with data:', refundRequestData);
      
      const refundRequest = new RefundRequest(refundRequestData);
      await refundRequest.save();
      
      console.log('✅ Refund request created:', refundRequest._id);

      // Cập nhật trạng thái booking nếu đây là booking thực
      if (!booking.isVirtualBooking) {
        booking.status = 'refund_requested';
        await booking.save();
        console.log('✅ Updated booking status to refund_requested');
      }
      
      // Cập nhật trạng thái vé nếu đây là ticket ID
      if (ticketInfo) {
        try {
          ticketInfo.status = 'refund_requested';
          await ticketInfo.save();
          console.log('✅ Updated ticket status to refund_requested');
        } catch (ticketError) {
          console.error('❌ Error updating ticket status:', ticketError);
          // Không throw error, vì vé này vẫn sẽ được xử lý bởi admin
          // Ghi log lỗi và tiếp tục
        }
      }

      // Không gửi thông báo cho admin để tránh lỗi validation
      // Hiển thị yêu cầu hoàn tiền trong danh sách cho admin là đủ

      return res.status(201).json({
        success: true,
        message: 'Yêu cầu hoàn tiền đã được ghi nhận và đang chờ xử lý',
        refundRequest
      });
    } catch (innerError) {
      console.error('❌ Error in processing refund request:', innerError);
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi xử lý yêu cầu hoàn tiền',
        error: innerError.message,
        stack: innerError.stack
      });
    }
  } catch (error) {
    console.error('❌ Error creating refund request:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi tạo yêu cầu hoàn tiền',
      error: error.message,
      stack: error.stack
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
    
    // Tìm và cập nhật yêu cầu hoàn tiền, populate thông tin người dùng để gửi email
    const refundRequest = await RefundRequest.findById(id).populate({
      path: 'user',
      select: 'email fullName username'
    }).populate({
      path: 'event',
      select: 'title'
    });
    
    if (!refundRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu hoàn tiền'
      });
    }
    
    // Cập nhật trạng thái
    refundRequest.status = status;
    refundRequest.adminNotes = adminNotes || refundRequest.adminNotes;
    
    // Chuẩn bị email
    const sendEmail = require('../config/email');
    let emailSubject = '';
    let emailContent = '';
    
    if (status === 'completed') {
      refundRequest.completedAt = new Date();
      refundRequest.completedBy = adminId;
      
      // Cập nhật trạng thái booking nếu có
      try {
        await Booking.findByIdAndUpdate(refundRequest.booking, {
          status: 'refunded'
        });
      } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái booking:', error);
        // Không dừng quá trình, tiếp tục xử lý
      }
      
      // Nội dung email hoàn tiền thành công
      emailSubject = `[Event Ticket Portal] Yêu cầu hoàn tiền đã được xử lý`;
      emailContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4CAF50;">Hoàn tiền thành công</h2>
          <p>Xin chào ${refundRequest.user.fullName || refundRequest.user.username},</p>
          <p>Yêu cầu hoàn tiền của bạn cho sự kiện <strong>${refundRequest.event.title}</strong> đã được xử lý thành công.</p>
          <p>Số tiền <strong>${refundRequest.refundAmount.toLocaleString('vi-VN')}đ</strong> đã được chuyển về tài khoản của bạn.</p>
          <p>Thông tin tài khoản:</p>
          <ul>
            <li>Ngân hàng: ${refundRequest.bankInfo.bankName}</li>
            <li>Số tài khoản: ${refundRequest.bankInfo.accountNumber}</li>
            <li>Chủ tài khoản: ${refundRequest.bankInfo.accountHolderName}</li>
          </ul>
          ${adminNotes ? `<p>Ghi chú: ${adminNotes}</p>` : ''}
          <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
          <p>Trân trọng,<br>Event Ticket Portal Team</p>
        </div>
      `;
    } else if (status === 'rejected') {
      refundRequest.rejectedAt = new Date();
      refundRequest.rejectedBy = adminId;
      refundRequest.rejectionReason = req.body.rejectionReason;
      
      // Cập nhật trạng thái booking nếu có
      try {
        await Booking.findByIdAndUpdate(refundRequest.booking, {
          status: 'confirmed'
        });
      } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái booking:', error);
        // Không dừng quá trình, tiếp tục xử lý
      }
      
      // Nội dung email từ chối hoàn tiền
      emailSubject = `[Event Ticket Portal] Yêu cầu hoàn tiền đã bị từ chối`;
      emailContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #F44336;">Yêu cầu hoàn tiền bị từ chối</h2>
          <p>Xin chào ${refundRequest.user.fullName || refundRequest.user.username},</p>
          <p>Yêu cầu hoàn tiền của bạn cho sự kiện <strong>${refundRequest.event.title}</strong> đã bị từ chối.</p>
          <p><strong>Lý do từ chối:</strong> ${req.body.rejectionReason || 'Không đáp ứng điều kiện hoàn tiền'}</p>
          ${adminNotes ? `<p>Ghi chú: ${adminNotes}</p>` : ''}
          <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi để được giải đáp.</p>
          <p>Trân trọng,<br>Event Ticket Portal Team</p>
        </div>
      `;
    } else if (status === 'processing') {
      // Nội dung email đang xử lý hoàn tiền
      emailSubject = `[Event Ticket Portal] Yêu cầu hoàn tiền đang được xử lý`;
      emailContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2196F3;">Yêu cầu hoàn tiền đang được xử lý</h2>
          <p>Xin chào ${refundRequest.user.fullName || refundRequest.user.username},</p>
          <p>Yêu cầu hoàn tiền của bạn cho sự kiện <strong>${refundRequest.event.title}</strong> hiện đang được xử lý.</p>
          <p>Chúng tôi sẽ thông báo cho bạn ngay sau khi quá trình hoàn tiền hoàn tất.</p>
          ${adminNotes ? `<p>Ghi chú: ${adminNotes}</p>` : ''}
          <p>Trân trọng,<br>Event Ticket Portal Team</p>
        </div>
      `;
    }
    
    await refundRequest.save();
    
    // Gửi email thông báo cho khách hàng
    try {
      if (refundRequest.user && refundRequest.user.email) {
        await sendEmail({
          email: refundRequest.user.email,
          subject: emailSubject,
          message: emailContent
        });
        console.log(`✅ Đã gửi email thông báo trạng thái hoàn tiền "${status}" cho ${refundRequest.user.email}`);
      }
    } catch (emailError) {
      console.error('❌ Lỗi gửi email:', emailError);
      // Không dừng quá trình xử lý nếu gửi email thất bại
    }
    
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