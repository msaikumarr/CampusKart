const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  entityType: {
    type: String,
    enum: ['user', 'item', 'chat'],
    required: true,
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    default: null,
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    default: null,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  note: {
    type: String,
    trim: true,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);