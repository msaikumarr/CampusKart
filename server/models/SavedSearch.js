const mongoose = require('mongoose');

const savedSearchSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    trim: true,
    default: '',
  },
  query: {
    type: String,
    trim: true,
    default: '',
  },
  category: {
    type: String,
    default: 'All',
  },
  mine: {
    type: Boolean,
    default: false,
  },
  campusOnly: {
    type: Boolean,
    default: false,
  },
  priceMin: {
    type: Number,
    default: null,
  },
  priceMax: {
    type: Number,
    default: null,
  },
  sort: {
    type: String,
    default: 'newest',
  },
}, { timestamps: true });

module.exports = mongoose.model('SavedSearch', savedSearchSchema);