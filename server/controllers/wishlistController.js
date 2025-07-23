const Wishlist = require('../models/wishlist');

// Add item to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { itemId } = req.body;

    // Check for existing
    const exists = await Wishlist.findOne({
      user: req.user._id,
      item: itemId
    });

    if (exists) {
      return res.status(400).json({ message: "Item already in wishlist" });
    }

    const wishlistItem = new Wishlist({
      user: req.user._id,
      item: itemId
    });

    await wishlistItem.save();

    res.status(201).json({ message: "Item added to wishlist" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get wishlist items for user
const getWishlist = async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find({ user: req.user._id })
      .populate('item');

    res.json(wishlistItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { itemId } = req.params;

    await Wishlist.findOneAndDelete({
      user: req.user._id,
      item: itemId
    });

    res.json({ message: "Item removed from wishlist" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist
};
