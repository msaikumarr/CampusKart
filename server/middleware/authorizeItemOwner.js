const Item = require('../models/Item');

const authorizeItemOwner = async (req, res, next) => {
  try {
    const itemId = req.params.id;
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Check if current user is the creator of the item
    if (item.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You are not the owner' });
    }

    next(); // user is owner, proceed
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = authorizeItemOwner;
