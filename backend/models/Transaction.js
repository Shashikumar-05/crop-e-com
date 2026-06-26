const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  seller_amount: { type: Number, required: true },
  delivery_amount: { type: Number, required: true },
  platform_fee: { type: Number, required: true },
  payment_type: { type: String, enum: ['COD', 'Online', 'UPI', 'Cash'], required: true },
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Completed' }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
