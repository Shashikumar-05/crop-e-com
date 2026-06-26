const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: { type: String },
  type: {
    type: String,
    enum: ['product', 'delivery'],
    default: 'product'
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
