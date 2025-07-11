// @desc    Get tickets for the logged in user
// @route   GET /api/tickets/my-tickets
// @access  Private
const getUserTickets = async (req, res) => {
    try {
        console.log('=== GET USER TICKETS DEBUG ===');
        console.log('User ID from request:', req.user._id);
        console.log('User object:', JSON.stringify(req.user, null, 2));
        
        // Đơn giản hóa truy vấn để tránh lỗi
        console.log('🔍 Executing ticket query for user:', req.user._id);
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
        console.log('First ticket sample:', tickets.length > 0 ? JSON.stringify(tickets[0], null, 2) : 'No tickets');

        if (!tickets) {
            console.log('❌ No tickets found or query error');
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