const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');

const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(                       decoded.id);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: ' + error.message });
  }
};

module.exports = adminAuth;
