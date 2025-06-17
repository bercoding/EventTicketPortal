const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// Return ticket endpoint
router.post('/return/:ticketId', /*authMiddleware,*/ ticketController.returnTicket);

module.exports = router;
