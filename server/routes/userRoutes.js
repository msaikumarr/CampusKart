const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET user by ID (Public route)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username email phone _id');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error("User fetch error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
