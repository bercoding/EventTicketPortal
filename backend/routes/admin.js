const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);
router.use(authorize('admin'));

// Dashboard stats
router.get('/dashboard/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getUsers);
router.post('/users/:id/ban', adminController.banUser);
router.post('/users/:id/unban', adminController.unbanUser);

// Event management
router.get('/events', adminController.getEvents);
router.post('/events/:id/approve', adminController.approveEvent);
router.post('/events/:id/reject', adminController.rejectEvent);

// Complaint management
router.get('/complaints', adminController.getComplaints);
router.post('/complaints/:id/resolve', adminController.resolveComplaint);

// Post management
router.get('/posts', adminController.getPosts);
router.post('/posts/:id/moderate', adminController.moderatePost);
router.delete('/posts/:id', adminController.deletePost);

// Violation reports
router.get('/violation-reports', adminController.getViolationReports);
router.post('/violation-reports/:id/resolve', adminController.resolveViolationReport);

// Revenue
router.get('/revenue', adminController.getRevenue);

// Owner requests
router.get('/owner-requests', adminController.getOwnerRequests);
router.post('/owner-requests/:id/approve', adminController.approveOwnerRequest);
router.post('/owner-requests/:id/reject', adminController.rejectOwnerRequest);

module.exports = router; 