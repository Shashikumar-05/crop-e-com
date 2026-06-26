const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cropName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Vegetable', 'Grain', 'Fruit', 'Spice', 'Dairy', 'Organic', 'Pulses', 'Other'],
    default: 'Other',
  },
  description: {
    type: String,
  },
  totalStock: {
    type: Number,
    required: true,
  },
  availableStock: {
    type: Number,
    required: true,
  },
  soldQuantity: {
    type: Number,
    default: 0,
  },
  pricePerUnit: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    enum: ['kg', 'ton', 'quintal'],
    default: 'kg',
  },
  photos: {
    type: [String],
    default: []
  },
  farmLocation: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'out_of_stock'],
    default: 'available',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Crop', cropSchema);
