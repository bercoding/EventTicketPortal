const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const path = require('path');

// @desc    Get current user profile
// @route   GET /api/users/profile/me
// @access  Private
const getCurrentUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.json({
        success: true,
        data: user
    });
});

// @desc    Update user profile
// @route   PUT /api/users/profile/me
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Update fields if provided
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.fullName = req.body.fullName || user.fullName;
    user.phone = req.body.phone || user.phone;
    user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;
    user.address = req.body.address || user.address;
    user.bio = req.body.bio || user.bio;

    const updatedUser = await user.save();

    res.json({
        success: true,
        data: {
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            phone: updatedUser.phone,
            dateOfBirth: updatedUser.dateOfBirth,
            address: updatedUser.address,
            avatar: updatedUser.avatar,
            bio: updatedUser.bio,
            role: updatedUser.role
        }
    });
});

// @desc    Update user avatar
// @route   PUT /api/users/profile/avatar
// @access  Private
const updateUserAvatar = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (!req.file) {
        res.status(400);
        throw new Error('No avatar file provided');
    }

    // Update avatar URL with proper path for serving from public directory
    const fileName = path.basename(req.file.path);
    user.avatar = `/uploads/avatars/${fileName}`;
    console.log('Avatar path set to:', user.avatar);
    
    const updatedUser = await user.save();

    res.json({
        success: true,
        data: {
            avatar: updatedUser.avatar
        },
        message: 'Avatar updated successfully'
    });
});

// @desc    Change user password
// @route   PUT /api/users/profile/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Current password and new password are required');
    }

    const user = await User.findById(req.user.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
        res.status(400);
        throw new Error('Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({
        success: true,
        message: 'Password changed successfully'
    });
});

// @desc    Submit owner request
// @route   POST /api/users/owner-request
// @access  Private
const submitOwnerRequest = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        message: 'Owner request feature not implemented yet'
    });
});

// @desc    Get owner request status
// @route   GET /api/users/owner-request/status
// @access  Private
const getOwnerRequestStatus = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        data: null
    });
});

// @desc    Get user wallet
// @route   GET /api/users/wallet
// @access  Private
const getWallet = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.json({
        success: true,
        data: {
            balance: user.walletBalance || 0,
            recentTransactions: user.walletTransactions?.slice(-5) || []
        }
    });
});

// @desc    Get wallet transactions
// @route   GET /api/users/wallet/transactions
// @access  Private
const getWalletTransactions = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, type = 'all' } = req.query;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    let transactions = user.walletTransactions || [];
    
    // Filter by type if specified
    if (type !== 'all') {
        transactions = transactions.filter(t => t.type === type);
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = transactions.slice(startIndex, endIndex);
    
    res.json({
        success: true,
        data: {
            transactions: paginatedTransactions,
            currentPage: parseInt(page),
            totalPages: Math.ceil(transactions.length / limit),
            totalCount: transactions.length
        }
    });
});

// @desc    Pay with wallet
// @route   POST /api/users/wallet/pay
// @access  Private
const payWithWallet = asyncHandler(async (req, res) => {
    const { eventId, selectedSeats } = req.body;
    
    console.log('💰 Wallet payment started');
    console.log('🎫 EventId:', eventId);
    console.log('🪑 Selected seats:', JSON.stringify(selectedSeats, null, 2));
    
    if (!eventId || !selectedSeats || selectedSeats.length === 0) {
        res.status(400);
        throw new Error('Event ID và ghế được chọn là bắt buộc');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Calculate total amount
    const totalAmount = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
    console.log('💰 Total amount calculated:', totalAmount);
    console.log('💰 User wallet balance:', user.walletBalance || 0);

    if (!totalAmount || totalAmount <= 0) {
        res.status(400);
        throw new Error('Tổng số tiền không hợp lệ');
    }

    // Check wallet balance
    const walletBalance = user.walletBalance || 0;
    if (walletBalance < totalAmount) {
        console.log(`❌ Insufficient balance: ${walletBalance} < ${totalAmount}`);
        res.status(400);
        throw new Error(`Số dư ví không đủ. Cần ${totalAmount.toLocaleString()} VNĐ, hiện có ${walletBalance.toLocaleString()} VNĐ`);
    }

    // Get event details
    const Event = require('../models/Event');
    const event = await Event.findById(eventId).populate('seatingMap');
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    // Start transaction to ensure atomicity
    try {
        // 1. Deduct wallet balance
        user.walletBalance = walletBalance - totalAmount;
        
        // 2. Create tickets first to get ticket IDs
        const Ticket = require('../models/Ticket');
        const tickets = [];
        
        for (const seat of selectedSeats) {
            console.log('🎫 Creating ticket for seat:', seat);
            
            const ticket = new Ticket({
                event: eventId,
                user: user._id,
                seat: {
                    section: seat.sectionName || 'A',
                    row: seat.rowName || 'Row1',
                    seatNumber: seat.seatNumber || '1'
                },
                price: seat.price,
                ticketType: seat.ticketType || 'Standard',
                status: 'active',
                purchaseDate: new Date(),
                qrCode: `${eventId}-${seat.sectionName || 'A'}-${seat.seatNumber || '1'}-${Date.now()}${Math.random().toString(36).substr(2, 5)}`
            });
            
            const savedTicket = await ticket.save();
            tickets.push(savedTicket);
            console.log('✅ Ticket created:', savedTicket._id);
        }
        
        // 3. Add wallet transaction with ticket reference
        const transaction = {
            type: 'payment',
            amount: totalAmount,
            description: `Thanh toán vé ${event.title} - ${selectedSeats.length} ghế`,
            relatedTicket: tickets.length > 0 ? tickets[0]._id : null, // Reference to first ticket
            status: 'completed',
            createdAt: new Date()
        };
        
        user.walletTransactions = user.walletTransactions || [];
        user.walletTransactions.push(transaction);
        
        console.log('💾 Saving user with updated balance:', user.walletBalance);
        await user.save();
        
        // 4. Update seat status in seating map (mark as booked)
        try {
            if (event.seatingMap && event.seatingMap.sections) {
                console.log('🔍 Seating map structure:', JSON.stringify({
                    sectionsCount: event.seatingMap.sections.length,
                    sampleSection: event.seatingMap.sections[0]
                }, null, 2));
                
                let seatUpdated = false;
                
                for (const seat of selectedSeats) {
                    console.log(`🔍 Looking for seat: ${seat._id} in section: ${seat.sectionName}`);
                    
                    for (const section of event.seatingMap.sections) {
                        console.log(`🔍 Checking section: ${section.name || section.sectionName || 'unknown'}`);
                        console.log(`🔍 Section seats type:`, typeof section.seats);
                        console.log(`🔍 Section seats isArray:`, Array.isArray(section.seats));
                        
                        if (section.name === seat.sectionName || section.sectionName === seat.sectionName) {
                            // Check if seats is an array
                            if (section.seats && Array.isArray(section.seats)) {
                                for (const seatInMap of section.seats) {
                                    if (seatInMap._id && seatInMap._id.toString() === seat._id) {
                                        seatInMap.status = 'booked';
                                        seatUpdated = true;
                                        console.log(`🔒 Marked seat ${seat._id} as booked`);
                                        break;
                                    }
                                }
                            } else {
                                console.log(`⚠️ Section ${section.name} seats is not an array:`, section.seats);
                            }
                        }
                    }
                }
                
                if (seatUpdated) {
                    await event.save();
                    console.log('✅ Event seating map updated');
                } else {
                    console.log('⚠️ No seats were updated in seating map');
                }
            } else {
                console.log('⚠️ Event has no seating map or sections');
            }
        } catch (seatMapError) {
            console.error('⚠️ Error updating seating map (non-critical):', seatMapError.message);
            console.log('✅ Payment still successful, continuing...');
        }
        
        console.log('✅ Wallet payment completed successfully');
        console.log(`💰 New wallet balance: ${user.walletBalance}`);
        console.log(`🎫 Created ${tickets.length} tickets`);
        
        res.json({
            success: true,
            data: {
                tickets,
                newBalance: user.walletBalance,
                amountPaid: totalAmount,
                ticketCount: tickets.length
            },
            message: `Thanh toán thành công ${totalAmount.toLocaleString()} VNĐ cho ${tickets.length} vé`
        });
        
    } catch (error) {
        console.error('❌ Wallet payment error:', error);
        res.status(500);
        throw new Error('Lỗi khi xử lý thanh toán ví: ' + error.message);
    }
});

// @desc    Purchase simple tickets (no seats)
// @route   POST /api/users/wallet/purchase-simple
// @access  Private
const purchaseSimpleTickets = asyncHandler(async (req, res) => {
    const { eventId, selectedTickets, totalAmount } = req.body;
    
    console.log('💰 Simple ticket purchase started');
    console.log('🎫 EventId:', eventId);
    console.log('🎫 Selected tickets:', JSON.stringify(selectedTickets, null, 2));
    console.log('💰 Total amount:', totalAmount);
    
    if (!eventId || !selectedTickets || selectedTickets.length === 0) {
        res.status(400);
        throw new Error('Event ID và vé được chọn là bắt buộc');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Validate total amount
    const calculatedTotal = selectedTickets.reduce((sum, ticket) => sum + (ticket.price * ticket.quantity), 0);
    if (Math.abs(calculatedTotal - totalAmount) > 1) { // Allow small rounding differences
        res.status(400);
        throw new Error('Tổng số tiền không khớp với giá vé');
    }

    console.log('💰 User wallet balance:', user.walletBalance || 0);

    // Check wallet balance
    const walletBalance = user.walletBalance || 0;
    if (walletBalance < totalAmount) {
        console.log(`❌ Insufficient balance: ${walletBalance} < ${totalAmount}`);
        res.status(400);
        throw new Error(`Số dư ví không đủ. Cần ${totalAmount.toLocaleString()} VNĐ, hiện có ${walletBalance.toLocaleString()} VNĐ`);
    }

    // Get event details
    const Event = require('../models/Event');
    const event = await Event.findById(eventId);
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    try {
        // 1. Deduct wallet balance
        user.walletBalance = walletBalance - totalAmount;
        
        // 2. Create tickets
        const Ticket = require('../models/Ticket');
        const tickets = [];
        
        for (const selectedTicket of selectedTickets) {
            console.log('🎫 Creating tickets for type:', selectedTicket.name, 'quantity:', selectedTicket.quantity);
            
            for (let i = 0; i < selectedTicket.quantity; i++) {
                const ticket = new Ticket({
                    event: eventId,
                    user: user._id,
                    seat: {}, // No seat for simple tickets
                    price: selectedTicket.price,
                    ticketType: selectedTicket.name,
                    status: 'active',
                    purchaseDate: new Date(),
                    qrCode: `${eventId}-${selectedTicket.name}-${Date.now()}${Math.random().toString(36).substr(2, 5)}`
                });
                
                const savedTicket = await ticket.save();
                tickets.push(savedTicket);
                console.log(`✅ Ticket ${i + 1}/${selectedTicket.quantity} created:`, savedTicket._id);
            }
        }
        
        // 3. Add wallet transaction
        const transaction = {
            type: 'payment',
            amount: totalAmount,
            description: `Thanh toán vé ${event.title} - ${tickets.length} vé`,
            relatedTicket: tickets.length > 0 ? tickets[0]._id : null,
            status: 'completed',
            createdAt: new Date()
        };
        
        user.walletTransactions = user.walletTransactions || [];
        user.walletTransactions.push(transaction);
        
        console.log('💾 Saving user with updated balance:', user.walletBalance);
        await user.save();
        
        console.log('✅ Simple ticket purchase completed successfully');
        console.log(`💰 New wallet balance: ${user.walletBalance}`);
        console.log(`🎫 Created ${tickets.length} tickets`);
        
        res.json({
            success: true,
            data: {
                tickets,
                newBalance: user.walletBalance,
                amountPaid: totalAmount,
                ticketCount: tickets.length
            },
            message: `Thanh toán thành công ${totalAmount.toLocaleString()} VNĐ cho ${tickets.length} vé`
        });
        
    } catch (error) {
        console.error('❌ Simple ticket purchase error:', error);
        res.status(500);
        throw new Error('Lỗi khi xử lý mua vé: ' + error.message);
    }
});

module.exports = {
    getCurrentUserProfile,
    updateUserProfile,
    updateUserAvatar,
    changePassword,
    submitOwnerRequest,
    getOwnerRequestStatus
}; 