const express = require('express');
const router = express.Router();
const {
    createPaymentUrl,
    vnpayCallback,
    createPOSPayment,
    confirmPOSPayment,
    handlePayOSReturn,
    handlePayOSWebhook,
    getPaymentMethods,
    getPaymentHistory,
    getPaymentDetail,
    getPOSPayments,
    cancelPOSPayment,
    getPaymentStatus
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/methods', getPaymentMethods);

// PayOS public routes (no auth needed for callback)
router.get('/payos-return', handlePayOSReturn);
router.post('/payos-webhook', handlePayOSWebhook);

// POS Confirm route - placed before router.use(protect) with proper auth
router.put('/pos/:paymentId/confirm', protect, authorize('admin', 'event_owner'), (req, res, next) => {
    console.log('🔍 Route hit: /pos/:paymentId/confirm');
    console.log('📋 PaymentId:', req.params.paymentId);
    console.log('👤 User:', req.user?.email);
    console.log('🔒 Role:', req.user?.role);
    next();
}, confirmPOSPayment);

// Protected routes
router.use(protect);
router.post('/create-pos-payment', createPOSPayment);
router.get('/history', getPaymentHistory);
router.get('/detail/:paymentId', getPaymentDetail);

// Admin POS Management Routes
router.get('/pos', authorize('admin', 'event_owner'), getPOSPayments);
router.get('/status/:txnRef', getPaymentStatus);
router.put('/pos/:paymentId/cancel', authorize('admin', 'event_owner'), cancelPOSPayment);

module.exports = router; 