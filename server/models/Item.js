// models/Item.js

const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: String,
  category: String,
  price: Number,
  description: String,
  image: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
