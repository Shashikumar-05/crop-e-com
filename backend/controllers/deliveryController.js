const Order = require('../models/Order');

// ===== DELIVERY PARTNER CONTROLLER =====

// @desc Get orders assigned to this delivery partner
// @route GET /api/delivery/my-deliveries
const getMyDeliveries = async (req, res) => {
  try {
    const orders = await Order.find({ deliveryPartner: req.user._id })
      .populate('buyer', 'name phone location')
      .populate('items.farmer', 'name phone location')
      .populate('vehicle', 'vehicle_type vehicle_number')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get available orders (Assigned status, not yet picked up)
// @route GET /api/delivery/available
const getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      deliveryPartner: req.user._id,
      orderStatus: 'Assigned to Delivery Partner'
    })
      .populate('buyer', 'name phone location')
      .populate('items.farmer', 'name phone location')
      .populate('vehicle', 'vehicle_type vehicle_number')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Update delivery status (pick up, out for delivery, delivered)
// @route PUT /api/delivery/:id/update-status
const updateDeliveryStatus = async (req, res) => {
  try {
    const { status, paymentMethod, paymentScreenshot } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Verify this delivery partner is assigned
    if (order.deliveryPartner?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this delivery' });
    }

    order.orderStatus = status;
    if (status === 'Delivered') {
      order.deliveredAt = new Date();
      // Update payment details
      if (paymentMethod) order.paymentMethod = paymentMethod;
      if (paymentScreenshot) order.paymentScreenshot = paymentScreenshot;
      
      order.paymentStatus = 'Paid';

      // Free up the vehicle if it was assigned
      if (order.vehicle) {
        const Vehicle = require('../models/Vehicle');
        await Vehicle.findByIdAndUpdate(order.vehicle, {
          status: 'available',
          assigned_driver: null
        });
      }

      const User = require('../models/User');
      const Transaction = require('../models/Transaction');

      // 1. Credit Delivery Partner Wallet
      if (order.deliveryTotal) {
        await User.findByIdAndUpdate(req.user._id, { $inc: { walletBalance: order.deliveryTotal } });
      }

      // 2. Credit Seller Wallet
      if (order.items && order.items.length > 0) {
        const farmerId = order.items[0].farmer;
        if (farmerId && order.productTotal) {
          await User.findByIdAndUpdate(farmerId, { $inc: { walletBalance: order.productTotal } });
        }
      }

      // 3. Credit Manager/Admin Wallet (Platform Fee)
      if (order.manager && order.platformFee) {
        await User.findByIdAndUpdate(order.manager, { $inc: { walletBalance: order.platformFee } });
      }

      // 4. Create Transaction Record
      await Transaction.create({
        order_id: order._id,
        seller_amount: order.productTotal || 0,
        delivery_amount: order.deliveryTotal || 0,
        platform_fee: order.platformFee || 0,
        payment_type: paymentMethod || order.paymentMethod || 'COD',
        status: 'Completed'
      });
    }
    
    await order.save();

    res.json({ message: `Order updated to ${status}`, order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get delivery partner stats (earnings, counts)
// @route GET /api/delivery/stats
const getDeliveryStats = async (req, res) => {
  try {
    const allDeliveries = await Order.find({ deliveryPartner: req.user._id });
    const completed = allDeliveries.filter(o => o.orderStatus === 'Delivered');
    const active = allDeliveries.filter(o =>
      ['Picked Up', 'Out for Delivery'].includes(o.orderStatus)
    );
    const available = allDeliveries.filter(o => o.orderStatus === 'Assigned to Delivery Partner');

    // Sum deliveryTotal
    const totalEarnings = completed.reduce((sum, order) => sum + (order.deliveryTotal || 0), 0);

    res.json({
      totalDeliveries: allDeliveries.length,
      completedDeliveries: completed.length,
      activeDeliveries: active.length,
      availableDeliveries: available.length,
      totalEarnings
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get delivery history (completed deliveries)
// @route GET /api/delivery/history
const getDeliveryHistory = async (req, res) => {
  try {
    const delivered = await Order.find({
      deliveryPartner: req.user._id,
      orderStatus: 'Delivered'
    })
      .populate('buyer', 'name phone location')
      .sort({ deliveredAt: -1 });
    res.json(delivered);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Update Delivery Partner's Live Location
// @route POST /api/delivery/update-location
const updateLiveLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const user = await require('../models/User').findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.liveLocation = { lat, lng };
    await user.save();
    
    res.json({ message: 'Location updated', liveLocation: user.liveLocation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get all delivery partners live locations
// @route GET /api/delivery/live-locations
// @access Private (Manager)
const getAllLiveLocations = async (req, res) => {
  try {
    const User = require('../models/User');
    const partners = await User.find({ role: 'Delivery' }).select('name liveLocation phone vehicle');
    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getMyDeliveries,
  getAvailableOrders,
  updateDeliveryStatus,
  getDeliveryStats,
  getDeliveryHistory,
  updateLiveLocation,
  getAllLiveLocations
};
