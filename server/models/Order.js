const mongoose = require('mongoose');

const orderStatusValues = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const orderSchema = new mongoose.Schema({
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
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: orderStatusValues,
    default: 'placed',
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  trackingNotes: [
    {
      status: {
        type: String,
        enum: orderStatusValues,
        required: true,
      },
      note: String,
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      changedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
