const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard stats
router.get('/dashboard/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getUsers);
router.post('/users/:userId/ban', adminController.banUser);
router.post('/users/:userId/unban', adminController.unbanUser);

// Event management
router.get('/events', adminController.getEvents);
router.post('/events/:eventId/approve', adminController.approveEvent);
router.post('/events/:eventId/reject', adminController.rejectEvent);

// Complaint management
router.get('/complaints', adminController.getComplaints);
router.post('/complaints/:complaintId/resolve', adminController.resolveComplaint);

// Post management
router.get('/posts', adminController.getPosts);
router.post('/posts/:postId/moderate', adminController.moderatePost);
router.delete('/posts/:postId', adminController.deletePost);

// Violation reports
router.get('/violation-reports', adminController.getViolationReports);
router.post('/violation-reports/:reportId/resolve', adminController.resolveViolationReport);

// Revenue
router.get('/revenue', adminController.getRevenue);

// Owner requests
router.get('/owner-requests', adminController.getOwnerRequests);
router.post('/owner-requests/:requestId/approve', adminController.acceptOwnerRequest);
router.post('/owner-requests/:requestId/reject', adminController.rejectOwnerRequest);

module.exports = router; 