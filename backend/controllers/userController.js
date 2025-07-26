const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Sử dụng API thật cho xác thực CCCD
const { verifyIdCard, validateIdCardData } = require('../services/ekycService');

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
    user.phone = req.body.phoneNumber || user.phone; // Map phoneNumber from frontend
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio; // Map bio from frontend
    user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;
    user.address = req.body.address || user.address;

    const updatedUser = await user.save();

    res.json({
        success: true,
        data: {
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            phoneNumber: updatedUser.phone, // Trả về phoneNumber cho frontend
            bio: updatedUser.bio,           // Trả về bio cho frontend
            dateOfBirth: updatedUser.dateOfBirth,
            address: updatedUser.address,
            avatar: updatedUser.avatar,
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

    // Update avatar URL: chỉ lưu đường dẫn public
    let avatarPath = req.file.path.replace(/\\/g, '/');
    // Lấy phần sau 'public' (nếu có)
    const publicIndex = avatarPath.lastIndexOf('/public/');
    if (publicIndex !== -1) {
        avatarPath = avatarPath.substring(publicIndex + 7); // 7 là độ dài '/public/'
        if (!avatarPath.startsWith('/')) avatarPath = '/' + avatarPath;
    } else {
        // Nếu không có 'public', lấy phần sau 'uploads'
        const uploadsIndex = avatarPath.lastIndexOf('/uploads/');
        if (uploadsIndex !== -1) {
            avatarPath = avatarPath.substring(uploadsIndex);
            if (!avatarPath.startsWith('/')) avatarPath = '/' + avatarPath;
        }
    }
    user.avatar = avatarPath;
    const updatedUser = await user.save();

    res.json({
        success: true,
        data: {
            avatar: updatedUser.avatar
        }
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
// @route   POST /api/users/request-owner
// @access  Private
const OwnerRequest = require('../models/OwnerRequest');
const submitOwnerRequest = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { businessName, businessType, businessDescription, contactInfo, estimatedEventFrequency, previousExperience } = req.body;

    // Kiểm tra đã có yêu cầu chờ duyệt chưa
    const existing = await OwnerRequest.findOne({ user: userId, status: 'pending' });
    if (existing) {
        res.status(400);
        throw new Error('Bạn đã gửi yêu cầu và đang chờ duyệt.');
    }

    const request = await OwnerRequest.create({
        user: userId,
        businessName,
        businessType,
        businessDescription,
        contactInfo,
        estimatedEventFrequency,
        previousExperience,
        status: 'pending',
        createdAt: new Date()
    });

    res.json({ success: true, message: 'Đã gửi yêu cầu trở thành đối tác. Vui lòng chờ admin duyệt.', request });
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

// @desc    Verify ID card using VNPT eKYC
// @route   POST /api/users/verify-id-card
// @access  Private
const verifyIdCardController = asyncHandler(async (req, res) => {
    try {
        if (!req.files || !req.files.frontIdImage || !req.files.backIdImage) {
            res.status(400);
            throw new Error('Vui lòng tải lên cả mặt trước và mặt sau CCCD');
        }

        const frontIdPath = req.files.frontIdImage[0].path;
        const backIdPath = req.files.backIdImage[0].path;

        console.log('ID verification started');
        console.log(`Front ID image path: ${frontIdPath}`);
        console.log(`Back ID image path: ${backIdPath}`);

        // Log file info to debug
        const fs = require('fs');
        const frontIdStats = fs.statSync(frontIdPath);
        const backIdStats = fs.statSync(backIdPath);
        console.log(`Front ID file size: ${frontIdStats.size} bytes`);
        console.log(`Back ID file size: ${backIdStats.size} bytes`);

        try {
            // Bước 1: Xác thực mặt trước CCCD
            const frontIdResult = await verifyIdCard(frontIdPath, 'front');
            
            // Bước 2: Xác thực mặt sau CCCD nếu mặt trước thành công
            let backIdResult = null;
            if (frontIdResult.success) {
                backIdResult = await verifyIdCard(backIdPath, 'back');
            } else {
                throw new Error('Không thể nhận dạng mặt trước CCCD: ' + (frontIdResult.message || 'Lỗi không xác định'));
            }
            
            // Bước 3: Đối chiếu thông tin giữa 2 mặt CCCD
            if (frontIdResult.success && backIdResult.success) {
                const validationResult = validateIdCardData(frontIdResult.data, backIdResult.data);
                
                if (!validationResult.isValid) {
                    throw new Error(validationResult.message);
                }
                
                // Bước 4: Lưu thông tin vào DB
                const user = await User.findById(req.user.id);
                if (!user) {
                    res.status(404);
                    throw new Error('User not found');
                }
                
                // Kết hợp dữ liệu từ cả hai mặt của CCCD
                const frontData = frontIdResult.data;
                const backData = backIdResult.data;
                
                // Parse ngày tháng từ chuỗi nếu cần
                const parseDateString = (dateString) => {
                    if (!dateString) return null;
                    // Format phổ biến từ API: DD/MM/YYYY hoặc YYYY-MM-DD
                    let parts;
                    if (dateString.includes('/')) {
                        parts = dateString.split('/');
                        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    } else if (dateString.includes('-')) {
                        return new Date(dateString);
                    }
                    return null;
                };
                
                // Lưu thông tin vào hồ sơ người dùng
                user.idVerification = {
                    verified: true,
                    verifiedAt: new Date(),
                    frontIdImage: frontIdPath.replace(/^.*[\\\/]/, ''), // Chỉ lưu tên file
                    backIdImage: backIdPath.replace(/^.*[\\\/]/, ''),   // Chỉ lưu tên file
                    idNumber: frontData.id,
                    idFullName: frontData.name,
                    idDateOfBirth: parseDateString(frontData.birth_day || frontData.dob),
                    idAddress: frontData.home || frontData.address,
                    idIssueDate: parseDateString(backData.issue_date),
                    idIssuePlace: backData.issue_place,
                    gender: frontData.gender || frontData.sex,
                    nationality: frontData.nationality || 'Việt Nam',
                    verificationMethod: 'vnpt_ekyc',
                    rawOcrData: {
                        front: frontData,
                        back: backData
                    }
                };
                
                await user.save();
                
                // Trả về kết quả thành công
                res.json({
                    success: true,
                    message: 'Xác thực CCCD thành công',
                    data: {
                        verified: true,
                        verifiedAt: user.idVerification.verifiedAt,
                        name: user.idVerification.idFullName,
                        idNumber: user.idVerification.idNumber
                    }
                });
            } else {
                throw new Error('Không thể nhận dạng mặt sau CCCD: ' + (backIdResult?.message || 'Lỗi không xác định'));
            }
            
        } catch (aiError) {
            console.error('VNPT eKYC verification error:', aiError);
            res.status(400).json({
                success: false,
                message: aiError.message || 'Xác thực thất bại, vui lòng thử lại với ảnh khác',
                error: aiError.message
            });
        }
    } catch (error) {
        console.error('ID verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xử lý xác thực CCCD',
            error: error.message
        });
    }
});

/**
 * @desc    Lưu kết quả xác thực CCCD từ VNPT eKYC SDK Web
 * @route   POST /api/users/save-id-verification
 * @access  Private
 */
const saveIdVerification = asyncHandler(async (req, res) => {
  try {
    console.log('Nhận kết quả xác thực CCCD từ VNPT eKYC SDK Web');
    
    const ekycResult = req.body;
    if (!ekycResult || !ekycResult.ocr) {
      return res.status(400).json({ success: false, message: 'Dữ liệu xác thực không hợp lệ' });
    }

    // Kiểm tra kết quả xác thực
    const idVerified = 
      ekycResult.liveness_card_front?.liveness === 'success' && 
      ekycResult.liveness_card_back?.liveness === 'success' && 
      ekycResult.liveness_face?.liveness === 'success' &&
      ekycResult.compare?.msg === 'MATCH';
    
    if (!idVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Xác thực CCCD thất bại. Vui lòng kiểm tra lại ảnh và thử lại.'
      });
    }
    
    // Lấy thông tin từ kết quả OCR
    const ocrData = ekycResult.ocr;
    const frontData = {
      id: ocrData.id,
      name: ocrData.name,
      birth_day: ocrData.birth_day,
      gender: ocrData.gender,
      nationality: ocrData.nationality || 'Việt Nam',
      home: ocrData.home || ocrData.origin_location
    };
    
    const backData = {
      issue_date: ocrData.issue_date,
      issue_place: ocrData.issue_place
    };
    
    // Định dạng ngày tháng
    const parseDateString = (dateStr) => {
      if (!dateStr) return null;
      // Kiểm tra định dạng dd/mm/yyyy
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      return new Date(dateStr);
    };
    
    // Lưu thông tin vào User model
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    
    // Cập nhật thông tin xác thực
    user.idVerification = {
      verified: true, 
      verifiedAt: new Date(),
      frontIdImage: ekycResult.base64_doc_img ? `data:image/jpeg;base64,${ekycResult.base64_doc_img}` : null,
      backIdImage: ekycResult.base64_face_img ? `data:image/jpeg;base64,${ekycResult.base64_face_img}` : null,
      idNumber: frontData.id,
      idFullName: frontData.name,
      idDateOfBirth: parseDateString(frontData.birth_day),
      idAddress: frontData.home,
      idIssueDate: parseDateString(backData.issue_date),
      idIssuePlace: backData.issue_place,
      gender: frontData.gender,
      nationality: frontData.nationality,
      verificationMethod: 'vnpt_ekyc_sdk',
      rawOcrData: ekycResult
    };
    
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Xác thực CCCD thành công', 
      data: { 
        verified: true, 
        verifiedAt: user.idVerification.verifiedAt, 
        name: user.idVerification.idFullName, 
        idNumber: user.idVerification.idNumber 
      } 
    });
  } catch (error) {
    console.error('Lỗi khi lưu kết quả xác thực:', error);
    res.status(500).json({ success: false, message: `Lỗi khi lưu kết quả xác thực: ${error.message}` });
  }
});

module.exports = {
    getCurrentUserProfile,
    updateUserProfile,
    updateUserAvatar,
    changePassword,
    submitOwnerRequest,
    getOwnerRequestStatus,
    verifyIdCardController,
    saveIdVerification
}; 