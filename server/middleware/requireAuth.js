// middleware to verify JWT authentication
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');

const requireAuth = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user; // Attach user to request
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = requireAuth;
