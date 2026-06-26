const Order = require('../models/Order');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Withdrawal = require('../models/Withdrawal');
const sendEmail = require('../utils/sendEmail');
const { partnerApprovalTemplate, partnerRejectionTemplate } = require('../utils/emailTemplates');
const Notification = require('../models/Notification');

const getManagerOrders = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') return res.status(403).json({ message: 'Not authorized' });
    const orders = await Order.find()
      .populate('buyer', 'name email phone location')
      .populate('items.farmer', 'name phone location area')
      .populate('deliveryPartner', 'name phone location area')
      .populate('vehicle')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDeliveryPartners = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') return res.status(403).json({ message: 'Not authorized' });
    const partners = await User.find({ role: 'Delivery', account_status: 'approved' }).select('name phone location area availability_status account_status');
    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getVehicles = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') return res.status(403).json({ message: 'Not authorized' });
    const vehicles = await Vehicle.find({}).populate('assigned_driver', 'name account_status');
    
    // Filter out vehicles whose assigned driver is still pending
    const availableVehicles = vehicles.filter(v => {
      if (!v.assigned_driver) return true; // Company vehicle
      return v.assigned_driver.account_status === 'approved';
    });
    
    res.json(availableVehicles);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const assignDeliveryPartner = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') return res.status(403).json({ message: 'Not authorized' });
    const { deliveryPartnerId, vehicleId, distance } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const partner = await User.findById(deliveryPartnerId);
    if (!partner || partner.role !== 'Delivery') {
      return res.status(400).json({ message: 'Invalid delivery partner' });
    }

    if (distance) {
      order.deliveryDistance = Number(distance);
      order.deliveryRate = 20;
      order.deliveryTotal = Number(distance) * 20;
    }

    if (vehicleId) {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
      vehicle.status = 'busy';
      vehicle.assigned_driver = deliveryPartnerId;
      await vehicle.save();
      order.vehicle = vehicleId;
    }

    order.deliveryPartner = deliveryPartnerId;
    order.manager = req.user._id;
    order.orderStatus = 'Assigned to Delivery Partner';
    await order.save();

    // Create Notification
    try {
      await Notification.create({
        user: deliveryPartnerId,
        text: `New assigned delivery in your zone. Order ID: ${order.orderId || order._id}`,
        icon: '🚚'
      });
      // Notify buyer
      await Notification.create({
        user: order.buyer,
        text: `Your order is out for delivery with ${partner.name}.`,
        icon: '📍'
      });
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    res.json({ message: 'Delivery partner assigned successfully by manager', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getManagerStats = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') return res.status(403).json({ message: 'Not authorized' });
    const allOrders = await Order.find();
    
    // Basic stats for dashboard
    const totalOrders = allOrders.length;
    const waitingForAssignment = allOrders.filter(o => ['Pending', 'Waiting for Manager Review'].includes(o.orderStatus)).length;
    const assigned = allOrders.filter(o => ['Assigned to Delivery Partner', 'Picked Up', 'Out for Delivery'].includes(o.orderStatus)).length;
    const delivered = allOrders.filter(o => o.orderStatus === 'Delivered').length;
    // Admin/Manager Revenue = sum of totalAmount of all delivered orders
    const totalRevenue = allOrders.filter(o => o.orderStatus === 'Delivered').reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    res.json({ totalOrders, waitingForAssignment, assigned, delivered, totalRevenue });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getPendingUsers = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') return res.status(403).json({ message: 'Not authorized' });
    const pendingUsers = await User.find({ role: 'Delivery', account_status: 'pending' }).lean();
    for (let u of pendingUsers) {
      const v = await Vehicle.findOne({ assigned_driver: u._id });
      u.vehicleDetails = v;
    }
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getApprovalHistory = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') return res.status(403).json({ message: 'Not authorized' });
    const historyUsers = await User.find({ role: 'Delivery', account_status: { $in: ['approved', 'rejected'] } }).lean();
    for (let u of historyUsers) {
      const v = await Vehicle.findOne({ assigned_driver: u._id });
      u.vehicleDetails = v;
    }
    res.json(historyUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updatePendingUser = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') return res.status(403).json({ message: 'Not authorized' });
    const { status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.account_status = status;
    
    let generatedId = user.uniqueId;
    if (status === 'approved' && !user.uniqueId) {
      generatedId = Math.floor(100000 + Math.random() * 900000).toString();
      user.uniqueId = generatedId;
    }

    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Send email based on status
    if (status === 'approved') {
      await sendEmail({
        email: user.email,
        subject: 'Your Registration Has Been Approved ✅',
        message: partnerApprovalTemplate({
          name: user.name,
          email: user.email,
          uniqueId: generatedId,
          loginLink: `${frontendUrl}/login`
        })
      });
    } else if (status === 'rejected') {
      await sendEmail({
        email: user.email,
        subject: 'Delivery Partner Registration Update',
        message: partnerRejectionTemplate({
          name: user.name,
          reApplyLink: `${frontendUrl}/register`
        })
      });
    }

    // Create Notification
    try {
      await Notification.create({
        user: user._id,
        text: `Your account has been ${status}.`,
        icon: status === 'approved' ? '✅' : '❌'
      });
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    res.json({ message: `User ${status} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getWithdrawals = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') return res.status(403).json({ message: 'Not authorized' });
    const requests = await Withdrawal.find().populate('user', 'name email walletBalance role').sort({ createdAt: -1 });
    
    // Map to what frontend expects
    const formattedRequests = requests.map(req => ({
      _id: req._id,
      user_id: req.user,
      role: req.user?.role || 'Unknown',
      amount: req.amount,
      status: req.status.toLowerCase() === 'approved' ? 'completed' : req.status.toLowerCase(),
      createdAt: req.createdAt
    }));
    
    res.json(formattedRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateWithdrawal = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') return res.status(403).json({ message: 'Not authorized' });
    const { status } = req.body;
    const request = await Withdrawal.findById(req.params.id).populate('user');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    // Map 'completed' back to 'Approved', 'rejected' to 'Rejected'
    const newStatus = status === 'completed' ? 'Approved' : 'Rejected';
    
    if (newStatus === 'Approved' && request.status === 'Pending') {
      const user = await User.findById(request.user._id);
      if (user.walletBalance < request.amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      user.walletBalance -= request.amount;
      user.totalWithdrawn = (user.totalWithdrawn || 0) + request.amount;
      await user.save();
    }
    request.status = newStatus;
    await request.save();
    res.json({ message: `Withdrawal request ${status}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const confirmBill = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') return res.status(403).json({ message: 'Not authorized' });
    const { billQuantity, billPricePerKg, platformFee, deliveryDistance, deliveryRate, vehicleId, deliveryPartnerId } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    if (['Delivered', 'Cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Cannot edit bill for completed or cancelled orders' });
    }

    const productTotal = Number(billQuantity) * Number(billPricePerKg);
    const deliveryTotal = Number(deliveryDistance) * Number(deliveryRate);
    const grandTotal = productTotal + Number(platformFee) + deliveryTotal;

    order.billQuantity = Number(billQuantity);
    order.billPricePerKg = Number(billPricePerKg);
    order.productTotal = productTotal;
    order.platformFee = Number(platformFee);
    order.deliveryDistance = Number(deliveryDistance);
    order.deliveryRate = Number(deliveryRate);
    order.deliveryTotal = deliveryTotal;
    order.grandTotal = grandTotal;
    order.totalAmount = grandTotal;
    order.billConfirmed = true;
    order.manager = req.user._id;

    // Assignment Logic (Enhanced for Edit flexibility)
    if (vehicleId) {
      // If there was a previous vehicle and it's being changed
      if (order.vehicle && order.vehicle.toString() !== vehicleId) {
        const oldVehicle = await Vehicle.findById(order.vehicle);
        if (oldVehicle) {
          oldVehicle.status = 'available';
          await oldVehicle.save();
        }
      }

      const vehicle = await Vehicle.findById(vehicleId);
      if (vehicle) {
        vehicle.status = 'busy';
        if (deliveryPartnerId) {
          vehicle.assigned_driver = deliveryPartnerId;
        }
        await vehicle.save();
        order.vehicle = vehicleId;
      }
    }

    if (deliveryPartnerId) {
      order.deliveryPartner = deliveryPartnerId;
      order.orderStatus = 'Assigned to Delivery Partner';
    } else {
      // If it was already assigned but we are just editing price, keep the status
      if (!order.deliveryPartner) {
        order.orderStatus = 'Bill Confirmed';
      }
    }

    await order.save();
    
    res.json({ message: 'Bill confirmed and resources assigned successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const approveCancellation = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') return res.status(403).json({ message: 'Not authorized' });
    const { status } = req.body; // 'approved' or 'rejected'
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (status === 'approved') {
      order.orderStatus = 'Cancelled';
      order.cancelReason = order.cancellationDetails?.reason || 'Approved by manager';
      
      // Release vehicle if assigned
      if (order.vehicle) {
        const vehicle = await Vehicle.findById(order.vehicle);
        if (vehicle) {
          vehicle.status = 'available';
          await vehicle.save();
        }
      }
    } else {
      // Revert status. For simplicity, we'll go back to 'Pending' or similar
      // A more robust way would be to store 'previousStatus'
      order.orderStatus = order.billConfirmed ? 'Bill Confirmed' : 'Pending';
    }

    // Clear details after decision
    order.cancellationDetails = undefined;
    await order.save();

    res.json({ message: `Cancellation request ${status} successfully`, order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const quickAction = async (req, res) => {
  try {
    const { token } = req.params;
    const jwt = require('jsonwebtoken');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, action } = decoded;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send('<h1>User not found</h1>');
    
    if (user.account_status !== 'pending') {
      return res.send(`<h1>Action already taken</h1><p>Account status is already ${user.account_status}.</p>`);
    }

    user.account_status = action;
    
    let generatedId = user.uniqueId;
    if (action === 'approved' && !user.uniqueId) {
      generatedId = Math.floor(100000 + Math.random() * 900000).toString();
      user.uniqueId = generatedId;
    }

    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Send notification email to partner
    if (action === 'approved') {
      await sendEmail({
        email: user.email,
        subject: 'Your Registration Has Been Approved ✅',
        message: partnerApprovalTemplate({ 
          name: user.name, 
          email: user.email,
          uniqueId: generatedId,
          loginLink: `${frontendUrl}/login` 
        })
      });
    } else {
      await sendEmail({
        email: user.email,
        subject: 'Delivery Partner Registration Update',
        message: partnerRejectionTemplate({ name: user.name, reApplyLink: `${frontendUrl}/register` })
      });
    }

    res.send(`
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h1 style="color: ${action === 'approved' ? '#059669' : '#DC2626'}">Successfully ${action}!</h1>
        <p>The delivery partner <b>${user.name}</b> has been ${action}.</p>
        <p>A notification email has been sent to them.</p>
        <br/>
        <a href="${frontendUrl}/manager/approvals" style="padding: 10px 20px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
      </div>
    `);
  } catch (error) {
    res.status(400).send(`<h1>Invalid or expired link</h1><p>${error.message}</p>`);
  }
};

const managerCancelOrder = async (req, res) => {
  try {
    if (req.user.role !== 'Manager') return res.status(403).json({ message: 'Not authorized' });
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Cancellation reason is required' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (['Delivered', 'Cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ message: `Order is already ${order.orderStatus.toLowerCase()}` });
    }

    order.orderStatus = 'Cancelled';
    order.cancelReason = `Manager: ${reason}`;
    
    // Release vehicle if assigned
    if (order.vehicle) {
      const vehicle = await Vehicle.findById(order.vehicle);
      if (vehicle) {
        vehicle.status = 'available';
        vehicle.assigned_driver = null;
        await vehicle.save();
      }
    }

    await order.save();

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getManagerOrders,
  getDeliveryPartners,
  getVehicles,
  assignDeliveryPartner,
  getManagerStats,
  getPendingUsers,
  getApprovalHistory,
  updatePendingUser,
  getWithdrawals,
  updateWithdrawal,
  confirmBill,
  approveCancellation,
  quickAction,
  managerCancelOrder
};
