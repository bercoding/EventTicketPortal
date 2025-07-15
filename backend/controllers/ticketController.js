const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get tickets for the logged in user
// @route   GET /api/tickets/my-tickets
// @access  Private
const getUserTickets = async (req, res) => {
    try {
        console.log('=== GET USER TICKETS DEBUG ===');
        console.log('User ID from request:', req.user._id);
        
        // Đơn giản hóa truy vấn để tránh lỗi
        const tickets = await Ticket.find({ user: req.user._id })
            .populate({
                path: 'event',
                select: 'title startDate images venue'
            })
            .populate({
                path: 'bookingId',
                select: 'status'
            })
            .lean();

        console.log('Found tickets count:', tickets.length);

        if (!tickets) {
            return res.json([]);
        }

        // Format tickets with seat information
        const formattedTickets = tickets.map(ticket => ({
            ...ticket,
            section: ticket.seat?.section || null,
            seatNumber: ticket.seat?.seatNumber || null,
            row: ticket.seat?.row || null,
            bookingStatus: ticket.bookingId?.status || null
        }));

        console.log('✅ Returning formatted tickets to frontend:', formattedTickets.length);
        res.json(formattedTickets);
    } catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy thông tin vé.' });
    }
};

// @desc    Return a ticket
// @route   POST /api/tickets/:id/return
// @access  Private
const returnTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate('event');

        if (!ticket) {
            return res.status(404).json({ message: 'Không tìm thấy vé.' });
        }

        // Check if the logged-in user owns the ticket
        const userId = req.user.id || req.user._id;
        if (ticket.user.toString() !== userId.toString()) {
            return res.status(401).json({ message: 'Không được phép thực hiện hành động này.' });
        }
        
        // Check if ticket is already returned
        if (ticket.status === 'returned') {
            return res.status(400).json({ message: 'Vé này đã được trả.' });
        }

        // Check if ticket is already used
        if (ticket.isUsed) {
            return res.status(400).json({ message: 'Không thể trả vé đã được sử dụng.' });
        }

        const event = ticket.event;
        if (!event) {
            return res.status(404).json({ message: 'Không tìm thấy sự kiện liên quan đến vé này.' });
        }

        // Check if the return is made at least 24 hours before the event starts
        const eventStartDate = new Date(event.startDate);
        const now = new Date();
        const hoursDifference = (eventStartDate - now) / (1000 * 60 * 60);

        if (hoursDifference < 24) {
            return res.status(400).json({ message: 'Chỉ có thể trả vé trước 24 giờ kể từ khi sự kiện bắt đầu.' });
        }

        // Calculate refund amount (75% of ticket price)
        const refundAmount = ticket.price * 0.75;
        const feeAmount = ticket.price * 0.25;

        // Update ticket status
        ticket.status = 'returned';
        ticket.returnedAt = new Date();
        ticket.refundAmount = refundAmount;
        await ticket.save();
        
        // Add refund to user's balance/wallet and record transaction
        const user = await User.findById(userId);
        if(user) {
            user.walletBalance = (user.walletBalance || 0) + refundAmount;
            
            // Add transaction record
            user.walletTransactions.push({
                type: 'refund',
                amount: refundAmount,
                description: `Hoàn tiền vé: ${ticket.event.title}`,
                relatedTicket: ticket._id
            });
            
            await user.save();
            console.log(`💰 Updated user wallet balance: ${user.walletBalance} VNĐ`);
        }

        // Update seat status in seatingMap if seat information exists
        if (ticket.seat && ticket.seat.section && ticket.seat.row && ticket.seat.seatNumber) {
            console.log(`🔄 Updating seat status for: ${ticket.seat.section}-${ticket.seat.row}-${ticket.seat.seatNumber}`);
            
            const section = event.seatingMap?.sections?.find(s => s.name === ticket.seat.section);
            if (section) {
                console.log(`✅ Found section: ${section.name}`);
                const row = section.rows?.find(r => r.name === ticket.seat.row);
                if (row) {
                    console.log(`✅ Found row: ${row.name}`);
                    // Create expected seat number format: "B2-8"
                    const expectedSeatNumber = `${ticket.seat.row}-${ticket.seat.seatNumber}`;
                    const seat = row.seats?.find(s => s.number === expectedSeatNumber);
                    if (seat) {
                        console.log(`✅ Found seat: ${seat.number}, changing status from ${seat.status} to available`);
                        seat.status = 'available'; // Make seat available again
                    } else {
                        console.log(`❌ Seat not found: ${expectedSeatNumber}`);
                        console.log(`Available seats in row:`, row.seats?.map(s => s.number));
                    }
                } else {
                    console.log(`❌ Row not found: ${ticket.seat.row}`);
                    console.log(`Available rows:`, section.rows?.map(r => r.name));
                }
            } else {
                console.log(`❌ Section not found: ${ticket.seat.section}`);
                console.log(`Available sections:`, event.seatingMap?.sections?.map(s => s.name));
            }
        } else {
            console.log(`⚠️ Incomplete seat information:`, {
                section: ticket.seat?.section,
                row: ticket.seat?.row,
                seatNumber: ticket.seat?.seatNumber
            });
        }

        // Increase event's available ticket count
        if (event.availableSeats !== undefined) {
             event.availableSeats += 1;
        }
        
        await event.save();

        console.log(`✅ Ticket returned successfully: ${ticket._id}`);
        console.log(`💰 Refund amount: ${refundAmount.toLocaleString()} VNĐ`);
        console.log(`💸 Fee deducted: ${feeAmount.toLocaleString()} VNĐ`);

        res.json({ 
            message: `Trả vé thành công! Bạn được hoàn ${refundAmount.toLocaleString()} VNĐ (đã trừ phí 25%).`,
            refundAmount: refundAmount,
            feeAmount: feeAmount,
            originalPrice: ticket.price
        });

    } catch (error) {
        console.error('Error returning ticket:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

// @desc    Verify ticket by scanning QR code
// @route   POST /api/tickets/verify-qr
// @access  Private (Admin/Event Owner only)
const verifyTicket = async (req, res) => {
    try {
        const { qrCode, eventId } = req.body;
        console.log('🔍 VERIFY TICKET API ĐƯỢC GỌI');
        console.log('📋 Request body:', req.body);
        console.log('👤 User:', req.user.username, req.user.role);

        if (!qrCode) {
            console.log('❌ Lỗi: Mã QR không được cung cấp');
            return res.status(400).json({ success: false, message: 'Mã QR không được cung cấp' });
        }

        console.log('🔍 Verifying QR code:', qrCode, 'for event:', eventId || 'any event');

        // Tìm vé với QR code
        const query = { qrCode };
        if (eventId) {
            query.event = eventId; // Nếu có eventId, chỉ kiểm tra vé của sự kiện đó
        }

        const ticket = await Ticket.findOne(query)
            .populate({
                path: 'event',
                select: 'title startDate endDate venue'
            })
            .populate({
                path: 'user',
                select: 'username email fullName avatar'
            });

        if (!ticket) {
            return res.status(404).json({ 
                success: false, 
                message: 'Vé không hợp lệ hoặc không tồn tại' 
            });
        }

        // Kiểm tra vé đã được sử dụng chưa
        if (ticket.isUsed) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vé này đã được sử dụng', 
                usedAt: ticket.usedAt,
                ticket: {
                    id: ticket._id,
                    event: ticket.event.title,
                    user: ticket.user ? `${ticket.user.fullName || ticket.user.username}` : 'Không có thông tin',
                    seat: ticket.seat
                }
            });
        }

        // Kiểm tra vé có bị hủy hoặc trả lại không
        if (ticket.status === 'cancelled' || ticket.status === 'returned') {
            return res.status(400).json({ 
                success: false, 
                message: `Vé này đã bị ${ticket.status === 'cancelled' ? 'hủy' : 'trả lại'}`, 
                ticket: {
                    id: ticket._id,
                    event: ticket.event.title,
                    user: ticket.user ? `${ticket.user.fullName || ticket.user.username}` : 'Không có thông tin',
                    seat: ticket.seat,
                    status: ticket.status
                }
            });
        }

        // Kiểm tra vé có đúng sự kiện không (nếu có eventId)
        if (eventId && ticket.event._id.toString() !== eventId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vé không thuộc về sự kiện này',
                ticket: {
                    id: ticket._id,
                    actualEvent: ticket.event.title
                }
            });
        }

        // Đánh dấu vé đã được sử dụng
        ticket.isUsed = true;
        ticket.usedAt = new Date();
        await ticket.save();

        console.log('✅ Ticket verified successfully:', ticket._id);

        // Trả về thông tin về vé và người dùng
        res.status(200).json({
            success: true,
            message: 'Xác thực vé thành công',
            ticket: {
                id: ticket._id,
                event: {
                    id: ticket.event._id,
                    title: ticket.event.title,
                    date: ticket.event.startDate
                },
                user: ticket.user ? {
                    id: ticket.user._id,
                    name: ticket.user.fullName || ticket.user.username,
                    email: ticket.user.email,
                    avatar: ticket.user.avatar
                } : null,
                seat: ticket.seat ? {
                    section: ticket.seat.section,
                    row: ticket.seat.row,
                    number: ticket.seat.seatNumber
                } : null,
                ticketType: ticket.ticketType,
                price: ticket.price,
                purchaseDate: ticket.purchaseDate
            }
        });
    } catch (error) {
        console.error('Error verifying ticket:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

// @desc    Get ticket check-in statistics for an event
// @route   GET /api/tickets/stats/:eventId
// @access  Private (Admin/Event Owner)
const getTicketStats = async (req, res) => {
    try {
        const { eventId } = req.params;
        console.log('🔢 STATS API ĐƯỢC GỌI cho sự kiện:', eventId);
        console.log('👤 User:', req.user.username, req.user.role);
        
        const totalTickets = await Ticket.countDocuments({ event: eventId });
        const usedTickets = await Ticket.countDocuments({ event: eventId, isUsed: true });
        const unusedTickets = await Ticket.countDocuments({ event: eventId, isUsed: false, status: 'active' });
        const cancelledTickets = await Ticket.countDocuments({ event: eventId, status: 'cancelled' });
        const returnedTickets = await Ticket.countDocuments({ event: eventId, status: 'returned' });
        
        // Lấy thống kê theo thời gian check-in (theo giờ)
        const checkInsByHour = await Ticket.aggregate([
            { $match: { event: new mongoose.Types.ObjectId(eventId), isUsed: true } },
            { 
                $group: { 
                    _id: { 
                        hour: { $hour: "$usedAt" },
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$usedAt" } } 
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.date": 1, "_id.hour": 1 } }
        ]);
        
        res.status(200).json({
            success: true,
            stats: {
                total: totalTickets,
                used: usedTickets,
                unused: unusedTickets,
                cancelled: cancelledTickets,
                returned: returnedTickets,
                checkInsByHour: checkInsByHour.map(item => ({
                    date: item._id.date,
                    hour: item._id.hour,
                    count: item.count
                }))
            }
        });
    } catch (error) {
        console.error('Error getting ticket statistics:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

module.exports = {
    getUserTickets,
    returnTicket,
    verifyTicket,
    getTicketStats
}; 