const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Farmer', 'Buyer', 'Delivery', 'Manager'],
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  location: {
    type: String,
  },
  area: {
    type: String,
  },

  availability_status: {
    type: Boolean,
    default: true,
  },
  liveLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  account_status: {
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    default: 'approved'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  uniqueId: {
    type: String,
    sparse: true
  }
});

module.exports = mongoose.model('User', userSchema);
