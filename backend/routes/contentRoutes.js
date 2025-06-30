const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/sections', contentController.getAllSections);
router.get('/sections/:name', contentController.getSection);

// Admin only routes
router.put('/sections/:name', protect, isAdmin, contentController.updateSection);
router.post('/sections/initialize', protect, isAdmin, contentController.initializeSections);

module.exports = router; 