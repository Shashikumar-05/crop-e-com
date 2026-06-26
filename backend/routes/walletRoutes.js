const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMyWallet,
  requestWithdrawal,
  getAllRequests,
  processWithdrawal
} = require('../controllers/walletController');

router.get('/my-wallet', protect, getMyWallet);
router.post('/request-withdrawal', protect, requestWithdrawal);

// Manager routes
router.get('/all-requests', protect, getAllRequests);
router.put('/process-request/:id', protect, processWithdrawal);

module.exports = router;
