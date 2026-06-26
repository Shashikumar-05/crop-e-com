const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getMyOrders, createCODOrder, payExistingOrder, verifyExistingPayment, payExistingCOD } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/cod', protect, createCODOrder);
router.get('/my-orders', protect, getMyOrders);
router.post('/pay-existing', protect, payExistingOrder);
router.post('/verify-existing', protect, verifyExistingPayment);
router.post('/cod-existing', protect, payExistingCOD);

module.exports = router;
