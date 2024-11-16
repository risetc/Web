const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: {
    type: String,
    enum: ['admin', 'editor', 'user'],
    default: 'user',
  },
});

module.exports = mongoose.model('User', UserSchema);
