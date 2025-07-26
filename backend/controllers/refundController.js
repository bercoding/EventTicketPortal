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

          // Cập nhật lại seatingMap nếu có thông tin ghế
          if (ticketInfo.seat && event.seatingMap) {
            try {
              // Tìm section, row và seat tương ứng trong seatingMap
              const { section: sectionName, row: rowName, seatNumber } = ticketInfo.seat;
              
              console.log(`🔄 Updating seat availability for: ${sectionName}, ${rowName}, ${seatNumber}`);
              
              // Cách cập nhật trực tiếp hơn - không dựa vào cấu trúc phức tạp
              await Event.updateOne(
                { 
                  _id: event._id,
                  "seatingMap.sections.name": sectionName,
                  "seatingMap.sections.rows.name": rowName,
                  "seatingMap.sections.rows.seats.number": seatNumber
                },
                { 
                  $set: { 
                    "seatingMap.sections.$[section].rows.$[row].seats.$[seat].available": true,
                    "seatingMap.sections.$[section].rows.$[row].seats.$[seat].status": "available" 
                  },
                  $inc: { availableSeats: 1 }
                },
                { 
                  arrayFilters: [
                    { "section.name": sectionName },
                    { "row.name": rowName },
                    { "seat.number": seatNumber }
                  ]
                }
              );

              console.log(`✅ Direct update for seat ${sectionName}-${rowName}-${seatNumber}`);
              
              // Phương pháp thay thế 2: Cập nhật thông qua thao tác trực tiếp trên document
              const updatedEvent = await Event.findById(event._id);
              if (updatedEvent && updatedEvent.seatingMap && updatedEvent.seatingMap.sections) {
                let updated = false;
                
                for (const section of updatedEvent.seatingMap.sections) {
                  if (section.name === sectionName) {
                    for (const row of section.rows) {
                      if (row.name === rowName) {
                        for (const seat of row.seats) {
                          if (seat.number === seatNumber) {
                            seat.available = true;
                            if (seat.status) seat.status = "available";
                            updated = true;
                            console.log(`✅ Seat ${sectionName}-${rowName}-${seatNumber} marked as available (method 2)`);
                            break;
                          }
                        }
                        if (updated) break;
                      }
                    }
                    if (updated) break;
                  }
                }
                
                if (updated) {
                  await updatedEvent.save();
                  console.log('✅ Updated event seating map saved');
                  
                  // Đảm bảo tăng availableSeats
                  if (typeof updatedEvent.availableSeats === 'number') {
                    updatedEvent.availableSeats += 1;
                    await updatedEvent.save();
                    console.log('✅ Increased available seats count');
                  }
                }
              }
              
              // Phương pháp 3: Cập nhật trực tiếp với toán tử $
              await Event.updateOne(
                { _id: event._id },
                { $inc: { availableSeats: 1 } }
              );
              console.log('✅ Increased available seats count (method 3)');
              
              // In thông tin ghế để kiểm tra
              const eventAfterUpdate = await Event.findById(event._id);
              console.log(`📊 Event available seats after update: ${eventAfterUpdate.availableSeats}`);
              
            } catch (seatUpdateError) {
              console.error('❌ Error updating seat availability:', seatUpdateError);
              // Không dừng quá trình, tiếp tục xử lý
            }
          }
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
    const refundRequest = await RefundRequest.findById(id)
      .populate({
        path: 'user',
        select: 'email fullName username'
      })
      .populate({
        path: 'event',
        select: 'title seatingMap availableSeats'
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
      
      // Cập nhật trạng thái booking và ticket
      try {
        // Cập nhật booking status
        const booking = await Booking.findById(refundRequest.booking);
        if (booking) {
          booking.status = 'refunded';
          await booking.save();
          console.log(`✅ Updated booking ${booking._id} status to refunded`);
          
          // Nếu booking có tickets, cập nhật trạng thái của các vé
          if (booking.tickets && booking.tickets.length > 0) {
            for (const ticketId of booking.tickets) {
              const ticket = await Ticket.findById(ticketId);
              
              if (ticket) {
                // Cập nhật trạng thái vé thành 'returned'
                ticket.status = 'returned';
                await ticket.save();
                console.log(`✅ Updated ticket ${ticket._id} status to returned`);
                
                // Cập nhật lại seatingMap nếu có thông tin ghế
                if (ticket.seat) {
                  try {
                    const event = await Event.findById(ticket.event);
                    if (event && event.seatingMap) {
                      // Tìm section, row và seat tương ứng trong seatingMap
                      const { section: sectionName, row: rowName, seatNumber } = ticket.seat;
                      
                      console.log(`🔄 Updating seat availability for: ${sectionName}, ${rowName}, ${seatNumber}`);
                      
                      // Cập nhật trạng thái chỗ ngồi thành available (true)
                      if (event.seatingMap && event.seatingMap.sections) {
                        const sectionIndex = event.seatingMap.sections.findIndex(s => s.name === sectionName);
                        if (sectionIndex !== -1) {
                          const section = event.seatingMap.sections[sectionIndex];
                          const rowIndex = section.rows.findIndex(r => r.name === rowName);
                          
                          if (rowIndex !== -1) {
                            const row = section.rows[rowIndex];
                            const seatIndex = row.seats.findIndex(s => s.number === seatNumber);
                            
                            if (seatIndex !== -1) {
                              // Đánh dấu ghế là available
                              event.seatingMap.sections[sectionIndex].rows[rowIndex].seats[seatIndex].available = true;
                              await Event.updateOne(
                                { _id: event._id },
                                { $set: { 'seatingMap.sections': event.seatingMap.sections } }
                              );
                              console.log(`✅ Seat ${sectionName}-${rowName}-${seatNumber} marked as available`);
                              
                              // Cập nhật availableSeats của event
                              await Event.updateOne(
                                { _id: event._id },
                                { $inc: { availableSeats: 1 } }
                              );
                              console.log('✅ Increased available seats count');
                            }
                          }
                        }
                      }
                    }
                  } catch (seatUpdateError) {
                    console.error('❌ Error updating seat availability:', seatUpdateError);
                    // Không dừng quá trình, tiếp tục xử lý
                  }
                }
              }
            }
          }
        } else {
          console.log(`⚠️ Booking ${refundRequest.booking} not found`);
        }
      } catch (error) {
        console.error('❌ Lỗi khi cập nhật trạng thái booking/ticket:', error);
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
      
      // Cập nhật trạng thái booking và ticket về active
      try {
        const booking = await Booking.findById(refundRequest.booking);
        if (booking) {
          booking.status = 'confirmed';
          await booking.save();
          
          if (booking.tickets && booking.tickets.length > 0) {
            for (const ticketId of booking.tickets) {
              const ticket = await Ticket.findById(ticketId);
              if (ticket && ticket.status === 'refund_requested') {
                ticket.status = 'active';
                await ticket.save();
              }
            }
          }
        }
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