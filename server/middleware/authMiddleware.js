const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'campuskart_secret_key';

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id username');
    if (!user) return res.status(401).json({ message: 'Invalid token' });

    req.user = user; // attach user info for next middleware/routes
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: ' + error.message });
  }
};

module.exports = authenticateUser;
