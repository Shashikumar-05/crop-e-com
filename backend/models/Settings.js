const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  supportPhone: {
    type: String,
    default: '+919876543210'
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
