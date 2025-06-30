const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

const cancelExpiredTickets = async () => {
    try {
        console.log('🔄 Checking for expired pending tickets...');
        
        // Tìm các booking pending quá 10 phút
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        const expiredBookings = await Booking.find({
            status: 'pending',
            createdAt: { $lt: tenMinutesAgo }
        });

        console.log(`📊 Found ${expiredBookings.length} expired bookings`);

        for (const booking of expiredBookings) {
            console.log(`🎫 Processing expired booking: ${booking._id}`);
            
            // Cập nhật trạng thái booking
            booking.status = 'cancelled';
            await booking.save();
            
            // Cập nhật trạng thái các vé
            await Ticket.updateMany(
                { bookingId: booking._id },
                { $set: { status: 'cancelled' } }
            );
            
            // Cập nhật trạng thái payment
            await Payment.updateMany(
                { _id: booking.paymentId },
                { $set: { status: 'cancelled' } }
            );

            console.log(`✅ Cancelled booking ${booking._id} and its tickets`);
        }

        console.log('✅ Finished checking expired tickets');
    } catch (error) {
        console.error('❌ Error cancelling expired tickets:', error);
    }
};

module.exports = {
    cancelExpiredTickets
}; 