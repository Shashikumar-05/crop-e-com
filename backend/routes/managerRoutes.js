const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getManagerOrders, getDeliveryPartners, getVehicles, assignDeliveryPartner, getManagerStats, getPendingUsers, getApprovalHistory, updatePendingUser, getWithdrawals, updateWithdrawal, confirmBill, approveCancellation } = require('../controllers/managerController');

router.get('/orders', protect, getManagerOrders);
router.get('/delivery-partners', protect, getDeliveryPartners);
router.get('/vehicles', protect, getVehicles);
router.put('/assign-order/:id', protect, assignDeliveryPartner);
router.get('/stats', protect, getManagerStats);

router.get('/approvals/pending-users', protect, getPendingUsers);
router.get('/approvals/history', protect, getApprovalHistory);
router.put('/approvals/user/:id', protect, updatePendingUser);
router.get('/approvals/withdrawals', protect, getWithdrawals);
router.put('/approvals/withdrawal/:id', protect, updateWithdrawal);

// Manual Bill Confirmation
router.put('/confirm-bill/:id', protect, confirmBill);
router.put('/approve-cancellation/:id', protect, approveCancellation);
router.put('/manager-cancel/:id', protect, require('../controllers/managerController').managerCancelOrder);

// Quick Email Actions (Token Based)
router.get('/quick-action/:token', require('../controllers/managerController').quickAction);

module.exports = router;
