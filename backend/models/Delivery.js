const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'Picked Up', 'Out for Delivery', 'Delivered', 'Failed'],
    default: 'Pending'
  },
  pickupAddress: {
    type: String,
    required: true
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  customerName: { type: String },
  customerPhone: { type: String },
  farmerName: { type: String },
  farmerPhone: { type: String },
  earnings: {
    type: Number,
    default: 0
  },
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
