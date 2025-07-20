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
    console.log('== [RETURN TICKET] ==', { ticketId: req.params.id, userId: req.user?.id });
    try {
        const ticket = await Ticket.findById(req.params.id).populate('event');

        if (!ticket) {
            console.log('Ticket not found:', req.params.id);
            return res.status(404).json({ message: 'Không tìm thấy vé.' });
        }
        console.log('Ticket:', ticket);

        // Check if the logged-in user owns the ticket
        const userId = req.user.id || req.user._id;
        if (ticket.user.toString() !== userId.toString()) {
            return res.status(401).json({ message: 'Không được phép thực hiện hành động này.' });
        }
        
        // Chỉ cho phép trả vé nếu vé đang có hiệu lực
        if (ticket.status === 'returned') {
            return res.status(400).json({ message: 'Vé này đã được trả trước đó.' });
        }
        if (ticket.status !== 'active' && ticket.status !== 'valid') {
            return res.status(400).json({ message: 'Vé không ở trạng thái có hiệu lực, không thể trả.' });
        }

        // Thực hiện trả vé
        ticket.status = 'returned';
        ticket.returnedAt = new Date();
        // Nếu có hoàn tiền, set refundAmount (ví dụ 75% giá vé)
        ticket.refundAmount = Math.floor(ticket.price * 0.75);
        await ticket.save();

        return res.json({ message: 'Trả vé thành công!', ticket });

    } catch (error) {
        console.error('Error returning ticket:', error, error?.stack);
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