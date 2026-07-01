const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cropName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  pricePerUnit: { type: Number, required: true },
  subtotal: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  order_id: { type: String, unique: true },
  order_month: { type: Number },
  order_year: { type: Number },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  deliveryAddress: { type: String, default: '' },
  pickupLocation: {
    lat: { type: Number, default: 12.9716 }, // Defaulting to somewhere in Bangalore
    lng: { type: Number, default: 77.5946 }
  },
  dropoffLocation: {
    lat: { type: Number, default: 12.9352 }, // Defaulting to somewhere in Bangalore
    lng: { type: Number, default: 77.6245 }
  },
  paymentMethod: { type: String, enum: ['COD', 'Online', 'UPI', 'Cash'], default: 'COD' },

  // Razorpay fields
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },
  razorpay_signature: { type: String },

  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  paymentScreenshot: { type: String },

  // Full order lifecycle
  orderStatus: {
    type: String,
    enum: ['Inquiry', 'Accepted', 'Rejected', 'Pending', 'Waiting for Manager Review', 'Bill Confirmed', 'Assigned to Delivery Partner', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled', 'Cancellation Pending'],
    default: 'Inquiry'
  },

  // Manual Bill Calculation Fields
  billConfirmed: { type: Boolean, default: false },
  billQuantity: { type: Number, default: 0 },
  billPricePerKg: { type: Number, default: 0 },
  productTotal: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  deliveryDistance: { type: Number, default: 0 },
  deliveryRate: { type: Number, default: 0 },
  deliveryTotal: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  sellerAmount: { type: Number, default: 0 },
  deliveryPartnerAmount: { type: Number, default: 0 },
  farmerPaidAmount: { type: Number, default: 0 },
  deliveryPartnerPaidAmount: { type: Number, default: 0 },
  farmerPaid: { type: Boolean, default: false },
  deliveryPartnerPaid: { type: Boolean, default: false },
  completedAt: { type: Date },

  // Delivery and Manager partner assignment
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
  totalQuantityKg: { type: Number, default: 0 },
  deliveredAt: { type: Date },
  cancelReason: { type: String },
  cancellationDetails: {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    requestDate: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
