const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMyDeliveries,
  getAvailableOrders,
  updateDeliveryStatus,
  getDeliveryStats,
  getDeliveryHistory,
  updateLiveLocation,
  getAllLiveLocations
} = require('../controllers/deliveryController');

// Delivery partner routes
router.get('/my-deliveries', protect, getMyDeliveries);
router.get('/available', protect, getAvailableOrders);
router.get('/stats', protect, getDeliveryStats);
router.get('/history', protect, getDeliveryHistory);
router.put('/:id/update-status', protect, updateDeliveryStatus);
router.post('/update-location', protect, updateLiveLocation);
router.get('/live-locations', protect, getAllLiveLocations);

module.exports = router;
