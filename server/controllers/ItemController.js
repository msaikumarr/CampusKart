const Item=require('../models/Item')
const User = require('../models/User');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const { SERVER_URL } = require('../config/env');
//creating an item
const createItem=async(req,res)=>{
    try{
    // Check if user is verified
    const user = await User.findById(req.user._id);
    if (!user.isAdmin && (!user.isVerified || user.verificationStatus !== 'approved')) {
      return res.status(403).json({ 
        message: 'Your account is not verified. Please submit your verification documents for admin approval.' 
      });
    }

    const {title,category,price,description}=req.body;
    const image = req.file ? `${SERVER_URL}/uploads/${req.file.filename}` : null;
    const newItem=new Item({
        title,
        category,
        price,
        description,
        image,
        createdBy:req.user._id, //must be logged-in user from middleware
        approvalStatus: user.isAdmin ? 'approved' : 'pending', // admin items auto-approved
        isApproved: user.isAdmin ? true : false
    });
    const savedItem=await newItem.save()
    // Fix image URL
    const fixedItem = {
      ...savedItem.toObject(),
      image: savedItem.image && savedItem.image.startsWith('/uploads/') 
        ? `${SERVER_URL}${savedItem.image}` 
        : savedItem.image
    };
    res.status(201).json({
      message: "Item added successfully",
      item: fixedItem
    });
}
catch(error){
    console.error(error)
    res.status(500).json({message:'Server error'})
}
}

//To get all items



const getItems = async (req, res) => {
  try {
    let query = {};
    const deliveredItemIds = await Order.distinct('item', { status: 'delivered' });
    
    // If ?mine=true, filter items for current user only
    if (req.query.mine === 'true') {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      query = {
        createdBy: req.user._id,
        _id: { $nin: deliveredItemIds },
      };
    } else {
      // Everyone can see all items.
      query = {
        isSold: { $ne: true },
        _id: { $nin: deliveredItemIds },
      };
    }

    const items = await Item.find(query)
      .populate('createdBy', '_id username email') // Add profilePic if needed
      .sort({ createdAt: -1 }); // Optional: latest first

    // Fix image URLs
    const fixedItems = items.map(item => ({
      ...item.toObject(),
      image: item.image && item.image.startsWith('/uploads/') 
        ? `${SERVER_URL}${item.image}` 
        : item.image
    }));

    res.json(fixedItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



//Get a single item by using id

const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('createdBy', 'username email phone'); // <-- make sure this includes email and phone

    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Fix image URL
    const fixedItem = {
      ...item.toObject(),
      image: item.image && item.image.startsWith('/uploads/') 
        ? `${SERVER_URL}${item.image}` 
        : item.image
    };

    res.json(fixedItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};






//update a item
const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    item.title = req.body.title || item.title;
    item.category = req.body.category || item.category;
    item.price = req.body.price || item.price;
    item.description = req.body.description || item.description;
    if (req.file) item.image = `${SERVER_URL}/uploads/${req.file.filename}`;

    const updatedItem = await item.save();
    // Fix image URL
    const fixedItem = {
      ...updatedItem.toObject(),
      image: updatedItem.image && updatedItem.image.startsWith('/uploads/') 
        ? `${SERVER_URL}${updatedItem.image}` 
        : updatedItem.image
    };
    res.json(fixedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a item
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await item.remove();
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Search items by title or category case-insensitive
const searchItems = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const regex = new RegExp(query, "i"); // i = case-insensitive
    const deliveredItemIds = await Order.distinct('item', { status: 'delivered' });

    const results = await Item.find({
      _id: { $nin: deliveredItemIds },
      isSold: { $ne: true },
      $or: [
        { title: { $regex: regex } },
        { category: { $regex: regex } },
        { description: { $regex: regex } }
      ]
    });

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports={createItem,getItems,getItemById,updateItem,deleteItem,searchItems}