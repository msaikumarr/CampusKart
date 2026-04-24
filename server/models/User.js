const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  phone: String,
  password: String,
  isAdmin: {
    type: Boolean,
    default: false  // regular users are not admins by default
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending' // users start as pending verification
  },
  verificationDocuments: {
    idDocument: String, // file path or URL
    proofOfAddress: String, // file path or URL
  },
  verificationDate: Date,
  rejectionReason: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
