const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const asyncHandler = 'express-async-handler';

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    const { eventId, tickets } = req.body;
    const userId = req.user._id;

    if (!eventId || !tickets || tickets.length === 0) {
        return res.status(400).json({ message: 'Dữ liệu không hợp lệ: eventId và tickets là bắt buộc.' });
    }

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Không tìm thấy sự kiện.' });
        }

        let totalPrice = 0;
        const selectedSeatsForValidation = [];

        // Validate seats and calculate price
        for (const ticketInfo of tickets) {
            const { sectionName, rowName, seatNumber } = ticketInfo.seat;

            const section = event.seatingMap.sections.find(s => s.name === sectionName);
            const row = section?.rows.find(r => r.name === rowName);
            const seat = row?.seats.find(s => s.number === seatNumber);

            if (!seat || seat.status !== 'available') {
                 return res.status(400).json({ message: `Ghế ${sectionName}-${rowName}-${seatNumber} không hợp lệ hoặc đã được đặt.` });
            }
            
            // Add price calculation logic here based on ticketTier or overridePrice
            const ticketType = event.ticketTypes.find(tt => tt._id.toString() === section.ticketTier.toString());
            if (!ticketType) {
                return res.status(400).json({ message: `Không tìm thấy loại vé cho khu vực ${section.name}.` });
            }
            const price = seat.overridePrice || ticketType.price || 0;
            totalPrice += price;
            
            selectedSeatsForValidation.push(seat);
        }

        // --- Create Booking ---
        const newBooking = new Booking({
            event: eventId,
            user: userId,
            tickets: tickets,
            totalPrice: totalPrice,
            status: 'confirmed', // Assuming payment is successful
            paymentDetails: {
                paymentMethod: 'wallet', // Example
                transactionId: `WALLET_TXN_${Date.now()}` // Example
            }
        });
        
        await newBooking.save();

        // --- Mark seats as sold and create tickets ---
        for (const seat of selectedSeatsForValidation) {
            seat.status = 'sold';
        }
        await event.save();
        
        // You might want to create actual Ticket documents here as well
        // and link them to the booking

        res.status(201).json({ success: true, data: newBooking });

    } catch (error) {
        console.error('Booking Error:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo đặt vé.' });
    }
};


module.exports = {
    createBooking,
}; 