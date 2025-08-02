const Item=require('../models/Item')
const mongoose = require('mongoose');
//creating an item
const createItem=async(req,res)=>{
    try{
    const {title,category,price,description}=req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const newItem=new Item({
        title,
        category,
        price,
        description,
        image,
        createdBy:req.user._id //must be logged-in user from middleware
    });
    const savedItem=await newItem.save()
    res.status(201).json({
      message: "Item added successfully",
      item: savedItem
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
    const items = await Item.find()
      .populate('createdBy', '_id username email') // Add profilePic if needed
      .sort({ createdAt: -1 }); // Optional: latest first

    res.json(items);
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

    res.json(item);
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
    if (req.file) item.image = `/uploads/${req.file.filename}`;

    const updatedItem = await item.save();
    res.json(updatedItem);
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

    const results = await Item.find({
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