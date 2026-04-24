const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');

// Optional auth - doesn't fail if token is missing, but sets req.user if present
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      // No token, proceed as unauthenticated
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id username');
    req.user = user || null;
    next();
  } catch (error) {
    // Token invalid or expired, proceed as unauthenticated
    req.user = null;
    next();
  }
};

module.exports = optionalAuth;
