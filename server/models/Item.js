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
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending' // items start as pending approval
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isSold: {
    type: Boolean,
    default: false,
  },
  soldAt: Date,
  rejectionReason: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // admin who approved/rejected
  },
  approvalDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
