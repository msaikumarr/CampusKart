const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'offer', 'meetup'],
      default: 'text',
    },
    message: {
      type: String,
      default: '',
      validate: {
        validator(value) {
          return Boolean(String(value || '').trim()) || Boolean(this.image) || Boolean(this.attachment?.url);
        },
        message: 'Message or attachment is required',
      },
    },
    image: {
      type: String,
      default: null,
    },
    attachment: {
      url: {
        type: String,
        default: null,
      },
      name: {
        type: String,
        default: null,
      },
      type: {
        type: String,
        default: null,
      },
      size: {
        type: Number,
        default: null,
      },
      isImage: {
        type: Boolean,
        default: false,
      },
    },
    deliveredTo: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      deliveredAt: {
        type: Date,
        default: Date.now,
      },
    }],
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
    offer: {
      amount: Number,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'countered'],
        default: 'pending',
      },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      respondedAt: Date,
      counterAmount: Number,
    },
    meetup: {
      location: String,
      scheduledFor: Date,
      status: {
        type: String,
        enum: ['proposed', 'accepted', 'declined'],
        default: 'proposed',
      },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      respondedAt: Date,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);