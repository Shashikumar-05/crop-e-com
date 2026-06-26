const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');

// @desc Get wallet balance and withdrawal history for logged in user (Seller or Delivery)
// @route GET /api/wallet/my-wallet
const getMyWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance totalWithdrawn');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const withdrawals = await Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.json({
      balance: user.walletBalance,
      totalWithdrawn: user.totalWithdrawn,
      withdrawals
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Request a withdrawal from wallet
// @route POST /api/wallet/request-withdrawal
const requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if enough balance
    if (user.walletBalance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Deduct from wallet and create pending request
    user.walletBalance -= amount;
    await user.save();

    const withdrawal = await Withdrawal.create({
      user: req.user._id,
      amount,
      status: 'Pending'
    });

    res.status(201).json({ message: 'Withdrawal requested successfully', withdrawal, newBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get all pending withdrawal requests (Manager only)
// @route GET /api/wallet/all-requests
const getAllRequests = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') return res.status(403).json({ message: 'Not authorized' });

    const requests = await Withdrawal.find()
      .populate('user', 'name email role phone walletBalance totalWithdrawn')
      .sort({ createdAt: -1 });
      
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Approve or Reject withdrawal request (Manager only)
// @route PUT /api/wallet/process-request/:id
const processWithdrawal = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') return res.status(403).json({ message: 'Not authorized' });

    const { status, managerNotes } = req.body; // 'Approved' or 'Rejected'
    const request = await Withdrawal.findById(req.params.id).populate('user');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    request.status = status;
    request.managerNotes = managerNotes || '';
    
    if (status === 'Approved') {
      // Amount was already deducted during request, so just add to totalWithdrawn
      await User.findByIdAndUpdate(request.user._id, {
        $inc: { totalWithdrawn: request.amount }
      });
    } else if (status === 'Rejected') {
      // Refund the amount back to user's wallet
      await User.findByIdAndUpdate(request.user._id, {
        $inc: { walletBalance: request.amount }
      });
    }

    await request.save();
    res.json({ message: `Request ${status.toLowerCase()}`, request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getMyWallet,
  requestWithdrawal,
  getAllRequests,
  processWithdrawal
};
