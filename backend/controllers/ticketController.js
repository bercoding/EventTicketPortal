const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User');

// @desc    Get tickets for the logged in user
// @route   GET /api/tickets/my-tickets
// @access  Private
const getUserTickets = async (req, res) => {
    try {
        console.log('=== GET USER TICKETS DEBUG ===');
        console.log('User ID from request:', req.user.id);
        console.log('User object:', JSON.stringify(req.user, null, 2));
        
        // Try both req.user.id and req.user._id for compatibility
        const userId = req.user.id || req.user._id;
        console.log('Final user ID used for query:', userId);
        
        const tickets = await Ticket.find({ user: userId })
            .populate('event', 'title startDate images venue'); // Populate event details

        console.log('Found tickets count:', tickets.length);
        console.log('Tickets found:', JSON.stringify(tickets, null, 2));

        if (!tickets || tickets.length === 0) {
            console.log('❌ No tickets found for user');
            return res.json([]); // Return empty array instead of 404
        }

        // Format tickets with seat information
        const formattedTickets = tickets.map(ticket => ({
            ...ticket.toObject(),
            section: ticket.seat?.section || null,
            seatNumber: ticket.seat?.seatNumber || null,
            row: ticket.seat?.row || null
        }));

        console.log('✅ Returning tickets to frontend');
        res.json(formattedTickets);
    } catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
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

module.exports = {
    getUserTickets,
    returnTicket
}; 