const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getSellerOrders,
  getAllOrders,
  updateOrderStatus,
  assignDelivery,
  getDeliveryPartners,
  getSellerStats,
  cancelOrder
} = require('../controllers/orderController');

// Seller order management
router.get('/seller', protect, getSellerOrders);
router.get('/all', protect, getAllOrders);
router.get('/seller-stats', protect, getSellerStats);
router.get('/delivery-partners', protect, getDeliveryPartners);
router.put('/:id/status', protect, updateOrderStatus);
router.put('/:id/assign', protect, assignDelivery);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;
