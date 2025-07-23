const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  phone: String,
  password: String,
  isAdmin: {
    type: Boolean,
    default: false  // regular users are not admins by default
  }
});

module.exports = mongoose.model('User', UserSchema);
