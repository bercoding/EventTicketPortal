const Payment = require('../models/Payment');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const mongoose = require('mongoose');
const VietQRService = require('../services/vietqrService');
const PayOSService = require('../services/payosService');
const Booking = require('../models/Booking');
const TicketType = require('../models/TicketType');
const User = require('../models/User');
const { sanitizeOrderInfo } = require('../utils/helpers');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');

// Initialize services
const vietqrService = new VietQRService();
const payosService = new PayOSService();

// @desc    Tạo URL thanh toán VNPay
// @route   POST /api/payments/create-payment-url
// @access  Private
const createPaymentUrl = asyncHandler(async (req, res) => {
    const { eventId, selectedSeats = [], selectedTickets = [], bookingType = 'seat', bankCode } = req.body;

    try {
        // Validate input based on booking type
        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp thông tin sự kiện'
            });
        }

        if (bookingType === 'simple') {
            if (!selectedTickets || selectedTickets.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng chọn ít nhất một loại vé'
                });
            }
        } else {
            if (!selectedSeats || selectedSeats.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng chọn ít nhất một ghế'
                });
            }
        }

        // ===== CRITICAL FIX: Validate eventId is not string "null" or "undefined" =====
        if (eventId === "null" || eventId === "undefined" || eventId === null || eventId === undefined) {
            console.error('Invalid eventId received:', eventId, typeof eventId);
            return res.status(400).json({
                success: false,
                message: 'ID sự kiện không hợp lệ. Vui lòng chọn lại sự kiện.'
            });
        }

        // Get event details
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sự kiện'
            });
        }

        // Calculate total amount based on booking type
        let totalAmount = 0;
        
        if (bookingType === 'simple') {
            for (const ticket of selectedTickets) {
                totalAmount += (ticket.price || 0) * (ticket.quantity || 0);
            }
        } else {
            for (const seat of selectedSeats) {
                totalAmount += seat.price || 0;
            }
        }

        if (totalAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền thanh toán không hợp lệ'
            });
        }

        // Create unique transaction reference for POS
        const pos_TxnRef = `POS_${eventId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        const orderInfo = sanitizeOrderInfo(`Thanh toan ve ${event.title}`);

        console.log('💳 Creating POS payment:', {
            eventId,
            selectedSeats,
            selectedTickets,
            totalAmount,
            bookingType,
            userId: req.user._id
        });

        // Create payment record
        const payment = new Payment({
            user: req.user._id,
            event: eventId,
            totalAmount: totalAmount,
            selectedSeats: selectedSeats.map(s => ({
                _id: s._id,
                sectionName: s.sectionName,
                rowName: s.rowName,
                seatNumber: s.seatNumber,
                price: s.price,
                ticketType: s.ticketType,
            })),
            selectedTickets: selectedTickets.map(t => ({
                ticketTypeId: t.ticketTypeId,
                quantity: t.quantity,
                price: t.price,
                ticketTypeName: t.name
            })),
            bookingType: bookingType,
            pos_TxnRef,
            orderInfo: orderInfo,
            status: 'pending',
            paymentMethod: 'pos'
        });

        await payment.save();

        // Create a pending booking
        const booking = new Booking({
            user: req.user._id,
            event: eventId,
            payment: payment._id,
            status: 'pending',
            totalPrice: totalAmount,
            bookingType: bookingType,
            selectedSeats: selectedSeats,
            selectedTickets: selectedTickets
        });

        await booking.save();

        // Create pending tickets
        if (bookingType === 'simple') {
            console.log('Creating simple tickets:', selectedTickets);
            for (const ticketInfo of selectedTickets) {
                console.log('Processing ticket type:', ticketInfo);
                for (let i = 0; i < ticketInfo.quantity; i++) {
                    const ticket = new Ticket({
                        event: eventId,
                        user: req.user._id,
                        bookingId: booking._id,
                        payment: payment._id,
                        price: ticketInfo.price,
                        status: 'pending',
                        ticketType: ticketInfo.name || 'Standard', // Ensure ticketType has a value
                        purchaseDate: new Date()
                    });
                    console.log('Creating ticket:', ticket);
                    await ticket.save();
                }
            }
        } else {
            console.log('Creating seating tickets:', selectedSeats);
            for (const seatInfo of selectedSeats) {
                console.log('Processing seat:', seatInfo);
                const ticket = new Ticket({
                    event: eventId,
                    user: req.user._id,
                    bookingId: booking._id,
                    payment: payment._id,
                    price: seatInfo.price,
                    status: 'pending',
                    ticketType: seatInfo.ticketType || 'Standard', // Ensure ticketType has a value
                    seat: {
                        section: seatInfo.sectionName,
                        row: seatInfo.rowName,
                        seatNumber: seatInfo.seatNumber
                    },
                    purchaseDate: new Date()
                });
                console.log('Creating ticket:', ticket);
                await ticket.save();
            }
        }

        // Update payment with booking reference
        payment.bookingId = booking._id;
        await payment.save();

        // Generate VietQR
        console.log('🏦 Generating VietQR...');
        const vietqrResult = await vietqrService.generateVietQR(
            totalAmount,
            pos_TxnRef,
            pos_TxnRef
        );

        if (!vietqrResult || !vietqrResult.qrDataURL) {
            throw new Error('Failed to generate VietQR');
        }

        console.log('✅ VietQR generated successfully');

        // Try to generate PayOS (optional - if fails, still return success with VietQR)
        let payosResult = null;
        try {
            console.log('💰 Creating PayOS payment link...');
            const orderCode = payosService.generateOrderCode('POS');
            
            const items = payosService.formatOrderItems(selectedTickets, selectedSeats);
            
            console.log('💰 Creating PayOS payment with data:', {
                orderCode,
                amount: totalAmount,
                description: orderInfo,
                itemsCount: items.length
            });

            payosResult = await payosService.createPaymentLink({
                orderCode: orderCode,
                amount: totalAmount,
                description: orderInfo,
                items: items,
                buyerInfo: {
                    name: req.user.name || req.user.email || 'Customer',
                    email: req.user.email || '',
                    phone: req.user.phone || ''
                }
            });

            if (payosResult && payosResult.success) {
                console.log('✅ PayOS payment link created successfully');
            } else {
                console.log('⚠️ PayOS payment creation failed, continuing with VietQR only');
                payosResult = null;
            }
        } catch (payosError) {
            console.log('⚠️ PayOS payment creation failed:', payosError.message);
            console.log('📱 Continuing with VietQR only...');
            payosResult = null;
        }

        // Update payment with results
        payment.vietqr_qrDataURL = vietqrResult.qrDataURL;
        payment.vietqr_bankInfo = vietqrResult.bankInfo;
        payment.vietqr_isFallback = vietqrResult.isFallback;
        
        if (payosResult && payosResult.success) {
            payment.payos_orderCode = payosResult.orderCode;
            payment.payos_checkoutUrl = payosResult.checkoutUrl;
            payment.payos_paymentLinkId = payosResult.paymentLinkId;
        }

        await payment.save();

        console.log('💳 POS payment created:', {
            payment: payment._id,
            pos_TxnRef,
            totalAmount
        });

        // Prepare response
        const response = {
            success: true,
            payment: payment._id,
            pos_TxnRef,
            totalAmount,
            vietqr: {
                qrDataURL: vietqrResult.qrDataURL,
                bankInfo: vietqrResult.bankInfo,
                isFallback: vietqrResult.isFallback
            }
        };

        // Add PayOS info if available
        if (payosResult && payosResult.success) {
            response.payos = {
                orderCode: payosResult.orderCode,
                checkoutUrl: payosResult.checkoutUrl,
                paymentLinkId: payosResult.paymentLinkId
            };
        }

        res.json(response);

    } catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo thanh toán: ' + error.message
        });
    }
});

// @desc    Xử lý callback từ VNPay
// @route   GET /api/payments/vnpay-callback
// @access  Public
const vnpayCallback = asyncHandler(async (req, res) => {
    try {
        const vnp_Params = req.query;
        const vnp_TxnRef = vnp_Params['vnp_TxnRef'];
        const vnp_ResponseCode = vnp_Params['vnp_ResponseCode'];

        // Verify the callback
        const verificationResult = vnpayService.verifyReturnUrl(vnp_Params);

        if (!verificationResult.isSuccess) {
            return res.status(400).json({
                success: false,
                message: 'Chữ ký không hợp lệ'
            });
        }

        // Find the payment record
        const payment = await Payment.findOne({ pos_TxnRef: vnp_TxnRef }).populate('event user');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giao dịch'
            });
        }

        // Update payment with VNPay response
        payment.vnp_ResponseCode = vnp_ResponseCode;
        payment.vnp_BankCode = vnp_Params['vnp_BankCode'];
        payment.vnp_BankTranNo = vnp_Params['vnp_BankTranNo'];
        payment.vnp_CardType = vnp_Params['vnp_CardType'];
        payment.vnp_PayDate = vnp_Params['vnp_PayDate'];
        payment.vnp_TransactionNo = vnp_Params['vnp_TransactionNo'];
        payment.vnp_TransactionStatus = vnp_Params['vnp_TransactionStatus'];
        payment.vnp_SecureHash = vnp_Params['vnp_SecureHash'];

        if (vnp_ResponseCode === '00') {
            // Payment successful, now create tickets and update seats.
            try {
                const event = await Event.findById(payment.event).populate('ticketTypes');
                if (!event) {
                    throw new Error(`Event with ID ${payment.event} not found during callback processing.`);
                }

                for (const seatInfo of payment.selectedSeats) {
                    // ===== DEBUG: Log chi tiết từng seat trước khi tạo ticket =====
                    console.log('=== CREATING TICKET FOR SEAT ===');
                    console.log('seatInfo object:', JSON.stringify(seatInfo, null, 2));
                    console.log('seatInfo.sectionName:', seatInfo.sectionName);
                    console.log('seatInfo.rowName:', seatInfo.rowName);
                    console.log('seatInfo.seatNumber:', seatInfo.seatNumber);
                    console.log('seatInfo.ticketType:', seatInfo.ticketType);
                    console.log('typeof seatInfo.ticketType:', typeof seatInfo.ticketType);
                    console.log('================================');

                    // ===== CRITICAL FIX: Ensure ticketType is never undefined =====
                    let finalTicketType = seatInfo.ticketType;
                    
                    // If ticketType is missing, try to determine it from the event's seating map
                    if (!finalTicketType || finalTicketType === 'undefined' || finalTicketType === 'null') {
                        console.log('⚠️ WARNING: ticketType is missing! Attempting to recover...');
                        
                        // Find the section and get ticket type from event data
                        const section = event.seatingMap?.sections?.find(s => s.name === seatInfo.sectionName);
                        if (section?.ticketTier) {
                            // Try to get ticket type name from event's ticketTypes
                            const ticketTypeObj = event.ticketTypes?.find(tt => tt._id.toString() === section.ticketTier.toString());
                            finalTicketType = ticketTypeObj?.name || 'Standard';
                            console.log(`✅ Recovered ticketType: ${finalTicketType}`);
                        } else {
                            // Ultimate fallback
                            finalTicketType = 'Standard';
                            console.log(`🔧 Using fallback ticketType: ${finalTicketType}`);
                        }
                    }
                    
                    console.log(`📝 Final ticketType to be used: "${finalTicketType}"`);
                    // ================================================================

                    // Create a new ticket for each selected seat
                    const newTicket = new Ticket({
                        event: payment.event,
                        user: payment.user,
                        price: seatInfo.price,
                        purchaseDate: new Date(),
                        status: 'pending',
                        ticketType: finalTicketType,
                        seat: {
                            section: seatInfo.sectionName,
                            row: seatInfo.rowName,
                            seatNumber: seatInfo.seatNumber,
                        },
                    });

                    console.log('=== TICKET OBJECT BEFORE SAVE ===');
                    console.log('ticketType in newTicket:', newTicket.ticketType);
                    console.log('newTicket object:', JSON.stringify(newTicket.toObject(), null, 2));
                    console.log('==================================');

                    const savedTicket = await newTicket.save();
                    console.log('✅ TICKET SAVED SUCCESSFULLY!');
                    console.log('Saved ticket ID:', savedTicket._id);
                    console.log('Saved ticket user:', savedTicket.user);
                    console.log('Saved ticket event:', savedTicket.event);
                    console.log('Saved ticket price:', savedTicket.price);
                    console.log('Saved ticket status:', savedTicket.status);
                    console.log('===========================');

                    // Find the corresponding seat in the event and mark it as sold
                    console.log('=== UPDATING SEAT STATUS ===');
                    console.log('Looking for seat:', seatInfo.sectionName, seatInfo.rowName, seatInfo.seatNumber);
                    console.log('seatInfo._id:', seatInfo._id);
                    console.log('Event seatingMap sections:', event.seatingMap?.sections?.length);
                    
                    const section = event.seatingMap.sections.find(s => s.name === seatInfo.sectionName);
                    console.log('Found section:', !!section, section?.name);
                    
                    if (section) {
                        let seatFound = false;
                        
                        // Method 1: Try to find by rowName and seatNumber if available
                        if (seatInfo.rowName && seatInfo.seatNumber) {
                            console.log('🔍 Method 1: Searching by rowName and seatNumber');
                            const row = section.rows.find(r => r.name === seatInfo.rowName);
                            console.log('Found row:', !!row, row?.name);
                            
                            if (row) {
                                const seat = row.seats.find(s => 
                                    s.number === seatInfo.seatNumber || 
                                    s.seatNumber === seatInfo.seatNumber ||
                                    s.number === String(seatInfo.seatNumber) ||
                                    s.seatNumber === String(seatInfo.seatNumber)
                                );
                                console.log('Found seat by row/number:', !!seat, seat?.number || seat?.seatNumber);
                                
                                if (seat) {
                                    console.log('✅ Method 1: Marking seat as sold');
                                    seat.status = 'sold';
                                    seatFound = true;
                                }
                            }
                        }
                        
                        // Method 2: If Method 1 failed, try to find by _id across all rows
                        if (!seatFound && seatInfo._id) {
                            console.log('🔍 Method 2: Searching by _id across all rows');
                            for (const row of section.rows) {
                                const seat = row.seats.find(s => s._id.toString() === seatInfo._id.toString());
                                if (seat) {
                                    console.log('✅ Method 2: Found seat by _id:', seat._id, 'in row:', row.name);
                                    console.log('Seat details:', { number: seat.number, status: seat.status });
                                    seat.status = 'sold';
                                    seatFound = true;
                                    break;
                                }
                            }
                        }
                        
                        // Method 3: If both methods failed, try to find by _id in the entire seating map
                        if (!seatFound && seatInfo._id) {
                            console.log('🔍 Method 3: Searching by _id in entire seating map');
                            for (const anySection of event.seatingMap.sections) {
                                for (const anyRow of anySection.rows) {
                                    const seat = anyRow.seats.find(s => s._id.toString() === seatInfo._id.toString());
                                    if (seat) {
                                        console.log('✅ Method 3: Found seat by _id:', seat._id, 'in section:', anySection.name, 'row:', anyRow.name);
                                        console.log('Seat details:', { number: seat.number, status: seat.status });
                                        seat.status = 'sold';
                                        seatFound = true;
                                        break;
                                    }
                                }
                                if (seatFound) break;
                            }
                        }
                        
                        if (!seatFound) {
                            console.log('❌ SEAT NOT FOUND by any method');
                            console.log('Available rows in section:', section.rows.map(r => r.name));
                            if (section.rows.length > 0) {
                                console.log('Sample seats in first row:', section.rows[0].seats.slice(0, 3).map(s => ({
                                    _id: s._id,
                                    number: s.number,
                                    status: s.status
                                })));
                            }
                        } else {
                            console.log('✅ SEAT STATUS UPDATED SUCCESSFULLY');
                        }
                    } else {
                        console.log('❌ Section not found in event');
                        console.log('Available sections:', event.seatingMap?.sections?.map(s => s.name));
                    }
                    console.log('=============================');
                }

                // Mark event as dirty to save changes to seating arrangement
                event.markModified('seatingMap');
                await event.save();

                // If all tickets are created successfully, update payment status to 'success'
                payment.status = 'success';
                
            } catch (ticketError) {
                console.error('VNPay callback error during ticket/seat processing:', ticketError);
                // If any error occurs during ticket creation, set payment status to 'failed'
                payment.status = 'failed'; // Corrected: Use valid enum 'failed'
            }

        } else {
            // Payment was not successful with VNPay
            payment.status = 'failed';
        }

        // Save the final payment status
        await payment.save();
        console.log(`Payment ${payment._id} processed with final status: ${payment.status}`);

        // Redirect user to frontend with payment result
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        
        if (payment.status === 'success') {
            console.log(`✅ Payment successful! Redirecting to success page`);
            res.redirect(`${frontendUrl}/payment/success?pos_TxnRef=${vnp_TxnRef}&amount=${payment.totalAmount}`);
        } else {
            console.log(`❌ Payment failed! Redirecting to failure page`);
            res.redirect(`${frontendUrl}/payment/failure?pos_TxnRef=${vnp_TxnRef}&reason=${vnp_ResponseCode}`);
        }

    } catch (error) {
        console.error('VNPay callback error:', error);
        // Redirect to failure page if any internal error occurs
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/payment/failure?reason=internal&message=${encodeURIComponent(error.message)}`);
    }
});

// @desc    Tạo thanh toán POS với VietQR và PayOS
// @route   POST /api/payments/create-pos-payment
// @access  Private
const createPOSPayment = asyncHandler(async (req, res) => {
    try {
        const { eventId, selectedSeats = [], selectedTickets = [], totalAmount, bookingType = 'seating' } = req.body;

        console.log('💳 Creating POS payment:', {
            eventId,
            selectedSeats,
            selectedTickets,
            totalAmount,
            bookingType,
            userId: req.user._id
        });

        // Validate required fields
        if (!eventId || !totalAmount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: eventId, totalAmount'
            });
        }

        if (bookingType === 'seating' && (!selectedSeats || selectedSeats.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Selected seats are required for seating events'
            });
        }

        if (bookingType === 'simple' && (!selectedTickets || selectedTickets.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Selected tickets are required for simple events'
            });
        }

        // Get event details
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sự kiện'
            });
        }

        // Create payment reference
        const pos_TxnRef = `POS_${eventId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const orderCode = payosService.generateOrderCode('EVT');
        
        // Create descriptions
        const description = `Thanh toan ve ${event.title}`;
        const addInfo = pos_TxnRef;

        console.log('🏦 Generating VietQR...');
        // Generate VietQR
        let vietqrResult;
        try {
            vietqrResult = await vietqrService.generateVietQR(totalAmount, description, addInfo);
            console.log('✅ VietQR generated:', vietqrResult.success ? 'Success' : 'Failed');
        } catch (error) {
            console.error('❌ VietQR error:', error.message);
            vietqrResult = { success: false, error: error.message };
        }

        console.log('💰 Creating PayOS payment link...');
        // Create PayOS payment link
        let payosResult;
        try {
            const items = payosService.formatOrderItems(selectedTickets, selectedSeats);
            const buyerInfo = {
                name: req.user.name || req.user.email,
                email: req.user.email,
                phone: req.user.phone || ''
            };

            payosResult = await payosService.createPaymentLink({
                orderCode: orderCode,
                amount: totalAmount,
                description: description,
                items: items,
                buyerInfo: buyerInfo
            });
            console.log('✅ PayOS generated:', payosResult.success ? 'Success' : 'Failed');
        } catch (error) {
            console.error('❌ PayOS error:', error.message);
            payosResult = { success: false, error: error.message };
        }

        // Create payment record
        const payment = new Payment({
            user: req.user._id,
            event: eventId,
            totalAmount: totalAmount,
            selectedSeats: bookingType === 'seating' ? selectedSeats : [],
            selectedTickets: bookingType === 'simple' ? selectedTickets : [],
            bookingType: bookingType,
            paymentMethod: 'pos',
            status: 'pending',
            pos_TxnRef: pos_TxnRef,
            
            // VietQR data
            vietqr_qrDataURL: vietqrResult.success ? vietqrResult.qrDataURL : null,
            vietqr_bankInfo: vietqrResult.success ? vietqrResult.bankInfo : null,
            vietqr_isFallback: vietqrResult.isFallback || false,
            
            // PayOS data
            payos_orderCode: orderCode,
            payos_checkoutUrl: payosResult.success ? payosResult.checkoutUrl : null,
            payos_paymentLinkId: payosResult.success ? payosResult.paymentLinkId : null,
            
            createdAt: new Date()
        });

        await payment.save();

        // Create a pending booking
        const booking = new Booking({
            user: req.user._id,
            event: eventId,
            payment: payment._id,
            status: 'pending',
            totalPrice: totalAmount,
            bookingType: bookingType,
            selectedSeats: selectedSeats,
            selectedTickets: selectedTickets
        });

        await booking.save();

        // Create pending tickets
        if (bookingType === 'simple') {
            console.log('Creating simple tickets:', selectedTickets);
            for (const ticketInfo of selectedTickets) {
                console.log('Processing ticket type:', ticketInfo);
                for (let i = 0; i < ticketInfo.quantity; i++) {
                    const ticket = new Ticket({
                        event: eventId,
                        user: req.user._id,
                        bookingId: booking._id,
                        payment: payment._id,
                        price: ticketInfo.price,
                        status: 'pending',
                        ticketType: ticketInfo.name || 'Standard', // Ensure ticketType has a value
                        purchaseDate: new Date()
                    });
                    console.log('Creating ticket:', ticket);
                    await ticket.save();
                }
            }
        } else {
            console.log('Creating seating tickets:', selectedSeats);
            for (const seatInfo of selectedSeats) {
                console.log('Processing seat:', seatInfo);
                const ticket = new Ticket({
                    event: eventId,
                    user: req.user._id,
                    bookingId: booking._id,
                    payment: payment._id,
                    price: seatInfo.price,
                    status: 'pending',
                    ticketType: seatInfo.ticketType || 'Standard', // Ensure ticketType has a value
                    seat: {
                        section: seatInfo.sectionName,
                        row: seatInfo.rowName,
                        seatNumber: seatInfo.seatNumber
                    },
                    purchaseDate: new Date()
                });
                console.log('Creating ticket:', ticket);
                await ticket.save();
            }
        }

        // Update payment with booking reference
        payment.bookingId = booking._id;
        await payment.save();

        console.log('💳 POS payment created:', {
            payment: payment._id,
            pos_TxnRef,
            totalAmount
        });

        res.json({
            success: true,
            pos_TxnRef,
            totalAmount,
            payment: payment._id,
            
            // VietQR data
            vietqr: vietqrResult.success ? {
                qrDataURL: vietqrResult.qrDataURL,
                bankInfo: vietqrResult.bankInfo,
                isFallback: vietqrResult.isFallback
            } : null,
            
            // PayOS data
            payos: payosResult.success ? {
                checkoutUrl: payosResult.checkoutUrl,
                orderCode: orderCode,
                qrCode: payosResult.qrCode
            } : null,
            
            message: 'Thanh toán POS đã sẵn sàng với VietQR và PayOS'
        });

    } catch (error) {
        console.error('POS payment creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo thanh toán POS: ' + error.message
        });
    }
});

// @desc    Xử lý return từ PayOS
// @route   GET /api/payments/payos-return
// @access  Public
const handlePayOSReturn = asyncHandler(async (req, res) => {
    try {
        const { code, id, cancel, status, orderCode } = req.query;

        console.log('🔄 PayOS return:', { code, id, cancel, status, orderCode });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        if (cancel === 'true') {
            // Payment was cancelled
            const payment = await Payment.findOne({ payos_orderCode: orderCode });
            if (payment) {
                payment.status = 'cancelled';
                await payment.save();
            }
            
            return res.redirect(`${frontendUrl}/payment/failure?reason=cancelled`);
        }

        if (code === '00') {
            // Payment successful
            const payment = await Payment.findOne({ payos_orderCode: orderCode }).populate('event user');
            if (payment) {
                payment.status = 'success';
                payment.payos_status = 'PAID';
                payment.payos_transactionDateTime = new Date();
                await payment.save();
                
                console.log('✅ PayOS payment successful');
            }
            
            return res.redirect(`${frontendUrl}/payment/success?orderCode=${orderCode}`);
        } else {
            // Payment failed
            const payment = await Payment.findOne({ payos_orderCode: orderCode });
            if (payment) {
                payment.status = 'failed';
                await payment.save();
            }
            
            return res.redirect(`${frontendUrl}/payment/failure?reason=failed&code=${code}`);
        }

    } catch (error) {
        console.error('PayOS return error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/payment/failure?reason=error`);
    }
});

// @desc    Xử lý webhook từ PayOS
// @route   POST /api/payments/payos-webhook
// @access  Public
const handlePayOSWebhook = asyncHandler(async (req, res) => {
    try {
        const webhookData = req.body;

        console.log('🔔 PayOS webhook received:', webhookData);

        // Verify webhook signature
        const isValid = payosService.verifyPaymentWebhookData(webhookData);
        if (!isValid) {
            console.log('❌ Invalid PayOS webhook signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const { orderCode, code, desc, data } = webhookData;
        
        if (code === '00' && data) {
            // Payment successful
            console.log('✅ PayOS webhook: Payment successful');
            
            const payment = await Payment.findOne({ payos_orderCode: orderCode }).populate('event user');
            if (payment && payment.status !== 'completed') {
                payment.payos_status = 'PAID';
                payment.payos_transactionDateTime = new Date();
                payment.status = 'completed';
                await payment.save();
                
                console.log('🎫 PayOS payment completed');
            }
        } else {
            // Payment failed
            console.log('❌ PayOS webhook: Payment failed');
            
            const payment = await Payment.findOne({ payos_orderCode: orderCode });
            if (payment) {
                payment.payos_status = 'CANCELLED';
                payment.status = 'failed';
                await payment.save();
            }
        }

        res.status(200).json({ message: 'Webhook processed' });

    } catch (error) {
        console.error('PayOS webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// @desc    Lấy danh sách phương thức thanh toán
// @route   GET /api/payments/methods
// @access  Public
const getPaymentMethods = asyncHandler(async (req, res) => {
    const methods = [
        { 
            code: 'pos', 
            name: 'Thanh toán tại quầy POS', 
            description: 'Thanh toán trực tiếp tại quầy với VietQR và PayOS'
        },
        {
            code: 'vietqr',
            name: 'VietQR Banking',
            description: 'Thanh toán qua QR code banking'
        },
        {
            code: 'payos',
            name: 'PayOS',
            description: 'Thanh toán online qua PayOS'
        }
    ];
    
    res.json({
        success: true,
        methods
    });
});

// @desc    Lấy lịch sử thanh toán của user
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = asyncHandler(async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user._id })
            .populate('event', 'title date location images')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            payments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy lịch sử thanh toán: ' + error.message
        });
    }
});

// @desc    Lấy chi tiết thanh toán
// @route   GET /api/payments/:id
// @access  Private
const getPaymentDetail = asyncHandler(async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id).populate('event user');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin thanh toán'
            });
        }

        // Check if user owns this payment or is admin
        if (payment.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập thông tin thanh toán này'
            });
        }

        res.json({
            success: true,
            payment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thông tin thanh toán: ' + error.message
        });
    }
});

// ===== POS PAYMENT MANAGEMENT FOR ADMIN =====

// Get all POS payments (Admin only)
const getPOSPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ paymentMethod: 'pos' })
            .sort({ createdAt: -1 })
            .populate('user', 'email fullName username')
            .populate('event', 'title')
            .lean();

        const formattedPayments = payments.map(payment => ({
            _id: payment._id,
            pos_TxnRef: payment.pos_TxnRef,
            user: payment.user ? {
                email: payment.user.email,
                fullName: payment.user.fullName,
                username: payment.user.username
            } : null,
            event: payment.event ? {
                title: payment.event.title,
                _id: payment.event._id
            } : null,
            amount: payment.totalAmount,
            status: payment.status,
            createdAt: payment.createdAt
        }));

        return res.status(200).json({
            status: 'success',
            payments: formattedPayments
        });
    } catch (error) {
        console.error('Error getting POS payments:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi lấy danh sách thanh toán POS'
        });
    }
};

// Confirm POS payment (Admin only)
const confirmPOSPayment = async (req, res) => {
    try {
        console.log('🔍 Starting POS payment confirmation...');
        console.log('🔍 CONTROLLER HIT: confirmPOSPayment');
        console.log('📋 Request params:', req.params);
        console.log('👤 Request user:', req.user?.email, req.user?.role);
        const { paymentId } = req.params;
        console.log('✅ Confirming POS payment:', paymentId);

        // Find payment and populate necessary fields
        console.log('🔍 Looking for payment with ID:', paymentId);
        const payment = await Payment.findById(paymentId)
            .populate('event')
            .populate('user');

        console.log('📊 Payment found:', payment ? 'YES' : 'NO');
        if (!payment) {
            console.log('❌ Payment not found with ID:', paymentId);
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giao dịch thanh toán'
            });
        }
        console.log('✅ Payment found:', payment._id, 'Status:', payment.status, 'Method:', payment.paymentMethod);

        // Validate payment
        if (payment.paymentMethod !== 'pos') {
            return res.status(400).json({
                success: false,
                message: 'Đây không phải là giao dịch POS'
            });
        }

        if (payment.status === 'success') {
            return res.status(400).json({
                success: false,
                message: 'Giao dịch đã được thanh toán'
            });
        }

        if (payment.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Giao dịch đã bị hủy'
            });
        }

        // 1. Find existing booking and tickets - support both old and new field names
        let booking = await Booking.findOne({ payment: payment._id });
        if (!booking) {
            // Try old field name for backward compatibility
            booking = await Booking.findOne({ paymentId: payment._id });
        }
        if (!booking) {
            console.log('❌ No booking found for payment ID:', payment._id);
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn đặt vé'
            });
        }
        console.log('✅ Found booking:', booking._id);

        // 2. Find all pending tickets for this payment - support both old and new field names
        let pendingTickets = await Ticket.find({
            payment: payment._id,
            status: 'pending'
        });
        
        if (pendingTickets.length === 0) {
            // Try old field name for backward compatibility
            pendingTickets = await Ticket.find({
                paymentId: payment._id,
                status: 'pending'
            });
        }

        console.log(`Found ${pendingTickets.length} pending tickets`);

        // Validate ticket count
        let expectedTicketCount = 0;
        if (payment.bookingType === 'seating') {
            expectedTicketCount = payment.selectedSeats.length;
        } else {
            expectedTicketCount = payment.selectedTickets.reduce((sum, t) => sum + t.quantity, 0);
        }

        if (pendingTickets.length !== expectedTicketCount) {
            return res.status(400).json({
                success: false,
                message: `Số lượng vé không khớp. Tìm thấy ${pendingTickets.length} vé, cần ${expectedTicketCount} vé`
            });
        }

        // 3. Update payment status
        payment.status = 'success';
        payment.paidAt = new Date();
        await payment.save();
        console.log('✅ Payment status updated to success');

        // 4. Update booking status
        booking.status = 'confirmed';
        booking.paymentDetails = {
            paymentMethod: 'pos',
            transactionId: payment.pos_TxnRef,
            paymentDate: new Date(),
            paidAt: new Date()
        };
        await booking.save();
        console.log('✅ Booking status updated to confirmed');

        // 5. Update all tickets
        const updatedTickets = await Promise.all(pendingTickets.map(async (ticket) => {
            ticket.status = 'active';
            ticket.purchaseDate = new Date();
            await ticket.save();
            console.log(`✅ Updated ticket ${ticket._id} to active`);
            return ticket;
        }));

        console.log(`✅ Successfully updated ${updatedTickets.length} tickets`);

        // 6. Update seating map if seating event
        if (payment.bookingType === 'seating' && payment.selectedSeats.length > 0) {
            console.log('🔄 Updating seating map...');
            const event = payment.event;
            
            for (const seatInfo of payment.selectedSeats) {
                console.log(`Marking seat as sold: ${seatInfo.sectionName} - ${seatInfo.rowName} - ${seatInfo.seatNumber}`);
                
                // Find the section
                const section = event.seatingMap?.sections?.find(s => s.name === seatInfo.sectionName);
                if (section) {
                    // Find the row
                    const row = section.rows?.find(r => r.name === seatInfo.rowName);
                    if (row) {
                        // Find the seat and update status
                        const seat = row.seats?.find(s => 
                            s.number === seatInfo.seatNumber || 
                            s.seatNumber === seatInfo.seatNumber ||
                            s._id.toString() === seatInfo._id?.toString()
                        );
                        if (seat) {
                            seat.status = 'sold';
                            console.log(`✅ Seat ${seatInfo.sectionName}-${seatInfo.rowName}-${seatInfo.seatNumber} marked as sold`);
                        } else {
                            console.log(`❌ Seat not found: ${seatInfo.sectionName}-${seatInfo.rowName}-${seatInfo.seatNumber}`);
                        }
                    } else {
                        console.log(`❌ Row not found: ${seatInfo.rowName} in section ${seatInfo.sectionName}`);
                    }
                } else {
                    console.log(`❌ Section not found: ${seatInfo.sectionName}`);
                }
            }
            
            // Save the updated event
            event.markModified('seatingMap');
            await event.save();
            console.log('✅ Seating map updated successfully');
        }

        return res.status(200).json({
            status: 'success',
            message: 'Xác nhận thanh toán thành công',
            payment: {
                _id: payment._id,
                pos_TxnRef: payment.pos_TxnRef,
                status: payment.status,
                paidAt: payment.paidAt
            },
            booking: {
                _id: booking._id,
                status: booking.status,
                tickets: updatedTickets.length
            }
        });

    } catch (error) {
        console.error('❌ Error during POS confirmation process:', error);
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Full error object:', error);
        
        // If mongoose validation error
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                status: 'error',
                message: 'Validation error: ' + error.message,
                errors: error.errors
            });
        }
        
        // If cast error (invalid ID)
        if (error.name === 'CastError') {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid ID format: ' + error.message
            });
        }
        
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi xác nhận thanh toán: ' + error.message,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Cancel POS payment (Admin only)
const cancelPOSPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        console.log('❌ Admin cancelling POS payment:', paymentId);

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy giao dịch thanh toán'
            });
        }

        if (payment.paymentMethod !== 'pos') {
            return res.status(400).json({
                success: false,
                error: 'Đây không phải là giao dịch POS'
            });
        }

        if (payment.status === 'paid') {
            return res.status(400).json({
                success: false,
                error: 'Không thể hủy giao dịch đã thanh toán'
            });
        }

        if (payment.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                error: 'Giao dịch đã bị hủy'
            });
        }

        // Update payment status
        payment.status = 'cancelled';
        payment.cancelledAt = new Date();
        await payment.save();

        // Update booking status if exists
        const booking = await Booking.findOne({ payment: payment._id });
        if (booking) {
            booking.status = 'cancelled';
            booking.cancelledAt = new Date();
            await booking.save();
            console.log('❌ Updated booking status to cancelled');
        }

        // Release seats/tickets back to available
        await releaseSeatsAndTickets(payment);

        console.log('❌ POS payment cancelled successfully');

        res.json({
            success: true,
            message: 'Hủy thanh toán thành công',
            payment: {
                _id: payment._id,
                pos_TxnRef: payment.pos_TxnRef,
                status: payment.status,
                cancelledAt: payment.cancelledAt
            }
        });
    } catch (error) {
        console.error('❌ Error cancelling POS payment:', error);
        res.status(500).json({
            success: false,
            error: 'Không thể hủy thanh toán'
        });
    }
};

// Helper function to generate tickets for seats
const generateTicketsForSeats = async (payment, booking) => {
    try {
        console.log('🎫 Generating tickets for seats');
        const generatedTickets = [];
        
        for (const seat of payment.selectedSeats) {
            const ticket = await Ticket.create({
                user: payment.user,
                event: payment.event,
                bookingId: booking._id,
                payment: payment._id,
                ticketType: 'seating',
                seat: {
                    section: seat.sectionName,
                    row: seat.rowName,
                    seatNumber: seat.seatNumber
                },
                price: seat.price,
                status: 'active',
                purchaseDate: new Date(),
                qrCode: `${payment.event}-${seat.sectionName}-${seat.seatNumber}-${Date.now()}`
            });
            
            generatedTickets.push(ticket);
            console.log(`✅ Generated ticket for seat ${seat.sectionName} - ${seat.seatNumber}`);
        }
        
        return generatedTickets;
    } catch (error) {
        console.error('❌ Error generating tickets for seats:', error);
        throw error;
    }
};

// Helper function to generate tickets for ticket types
const generateTicketsForTickets = async (payment, booking) => {
    try {
        console.log('🎫 Generating tickets for ticket types');
        const generatedTickets = [];
        
        for (const ticketInfo of payment.selectedTickets) {
            for (let i = 0; i < ticketInfo.quantity; i++) {
                const ticket = await Ticket.create({
                    user: payment.user,
                    event: payment.event,
                    bookingId: booking._id,
                    payment: payment._id,
                    ticketType: ticketInfo.ticketTypeName || ticketInfo.name || 'regular',
                    price: ticketInfo.price,
                    status: 'active',
                    purchaseDate: new Date(),
                    qrCode: `${payment.event}-${ticketInfo.ticketTypeName || ticketInfo.name}-${Date.now()}-${i}`
                });
                
                generatedTickets.push(ticket);
                console.log(`✅ Generated ticket ${i + 1}/${ticketInfo.quantity} for ${ticketInfo.ticketTypeName}`);
            }
        }
        
        return generatedTickets;
    } catch (error) {
        console.error('❌ Error generating tickets for ticket types:', error);
        throw error;
    }
};

// Helper function to release seats and tickets when cancelling
const releaseSeatsAndTickets = async (payment) => {
    try {
        console.log('🔄 Releasing seats and tickets');
        
        // Release ticket quantities back to available
        if (payment.selectedTickets) {
            for (const ticketInfo of payment.selectedTickets) {
                const ticketType = await TicketType.findById(ticketInfo.ticketTypeId);
                if (ticketType) {
                    ticketType.quantity += ticketInfo.quantity;
                    await ticketType.save();
                    console.log(`🔄 Released ${ticketInfo.quantity} tickets for ${ticketInfo.ticketTypeName}`);
                }
            }
        }

        // Note: For seating events, seats would be released based on your seating system
        // This depends on how your seat reservation system works
        
    } catch (error) {
        console.error('❌ Error releasing seats and tickets:', error);
        throw error;
    }
};

// Thêm hàm kiểm tra trạng thái thanh toán
const getPaymentStatus = async (req, res) => {
    try {
        const { txnRef } = req.params;
        console.log('Checking payment status for txnRef:', txnRef);
        
        // Tìm thanh toán theo mã giao dịch
        const payment = await Payment.findOne({
            $or: [
                { vnp_TxnRef: txnRef },
                { pos_TxnRef: txnRef }
            ]
        });

        console.log('Found payment:', payment);

        if (!payment) {
            console.log('Payment not found');
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy giao dịch'
            });
        }

        console.log('Returning payment status:', payment.status);
        return res.status(200).json({
            status: payment.status,
            message: 'Lấy trạng thái thanh toán thành công',
            payment: {
                id: payment._id,
                status: payment.status,
                txnRef: payment.pos_TxnRef || payment.vnp_TxnRef
            }
        });

    } catch (error) {
        console.error('Error getting payment status:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi kiểm tra trạng thái thanh toán'
        });
    }
};

module.exports = {
    createPaymentUrl,
    vnpayCallback,
    createPOSPayment,
    handlePayOSReturn,
    handlePayOSWebhook,
    getPaymentMethods,
    getPaymentHistory,
    getPaymentDetail,
    getPOSPayments,
    confirmPOSPayment,
    cancelPOSPayment,
    getPaymentStatus
}; 