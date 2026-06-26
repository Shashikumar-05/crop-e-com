const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicle_type: { type: String, required: true },
  vehicle_number: { type: String, required: true, unique: true },
  capacity_kg: { type: Number, required: true },
  price_per_km: { type: Number, required: true, default: 15 },
  status: { type: String, enum: ['available', 'busy'], default: 'available' },
  assigned_driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  current_location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  license_number: { type: String },
  license_image: { type: String },
  rc_book: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
