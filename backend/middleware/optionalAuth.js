const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware for optional authentication
// Works like protect middleware but doesn't return error when no token is provided
const optionalAuth = async (req, res, next) => {
  let token;
  
  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      if (!token) {
        // No token, continue as unauthenticated
        return next();
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from the token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        // Invalid token or user doesn't exist, continue as unauthenticated
        return next();
      }
      
      // Set user in request
      req.user = user;
      next();
    } catch (error) {
      // Invalid token, continue as unauthenticated
      console.log('Optional auth error:', error.message);
      next();
    }
  } else {
    // No token, continue as unauthenticated
    next();
  }
};

module.exports = optionalAuth; 