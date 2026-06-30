const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ===== SELLER/ADMIN ORDER MANAGEMENT =====

// @desc Get all orders for seller's products
// @route GET /api/orders/seller
const getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 'items.farmer': req.user._id })
      .populate('buyer', 'name email phone location')
      .populate('deliveryPartner', 'name phone')
      .sort({ createdAt: 1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get all orders (for any role — filtered by role in frontend)
// @route GET /api/orders/all
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('buyer', 'name email phone location')
      .populate('items.farmer', 'name phone location')
      .populate('deliveryPartner', 'name phone')
      .sort({ createdAt: 1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Update order status (seller confirms, packs, etc.)
// @route PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.orderStatus = status;
    if (status === 'Delivered') order.deliveredAt = new Date();
    await order.save();

    // Create Notification for Buyer
    try {
      await Notification.create({
        user: order.buyer,
        text: `Your order #${order.orderId || order._id} is now ${status}.`,
        icon: '📦'
      });
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    res.json({ message: `Order marked as ${status}`, order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Assign delivery partner to order
// @route PUT /api/orders/:id/assign
const assignDelivery = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Verify delivery partner exists and has correct role
    const partner = await User.findById(deliveryPartnerId);
    if (!partner || partner.role !== 'Delivery') {
      return res.status(400).json({ message: 'Invalid delivery partner' });
    }

    order.deliveryPartner = deliveryPartnerId;
    order.orderStatus = 'Assigned';
    await order.save();

    res.json({ message: 'Delivery partner assigned', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get all delivery partners (for assignment dropdown)
// @route GET /api/orders/delivery-partners
const getDeliveryPartners = async (req, res) => {
  try {
    const partners = await User.find({ role: 'Delivery' }).select('name phone location');
    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get seller dashboard stats
// @route GET /api/orders/seller-stats
const getSellerStats = async (req, res) => {
  try {
    const allOrders = await Order.find({ 'items.farmer': req.user._id });
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.filter(o => o.orderStatus === 'Delivered').reduce((s, o) => {
      const farmerItemsTotal = o.items.filter(i => i.farmer.toString() === req.user._id.toString()).reduce((acc, i) => acc + i.subtotal, 0);
      return s + farmerItemsTotal;
    }, 0);
    const pending = allOrders.filter(o => o.orderStatus === 'Pending').length;
    const delivered = allOrders.filter(o => o.orderStatus === 'Delivered').length;

    res.json({ totalOrders, totalRevenue, pending, delivered });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Cancel an order
// @route PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (['Delivered', 'Cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Cannot cancel an order that is already delivered or cancelled' });
    }

    order.orderStatus = 'Cancellation Pending';
    order.cancellationDetails = {
      requestedBy: req.user._id,
      reason: req.body.reason || 'No reason provided',
      requestDate: new Date()
    };
    
    await order.save();

    // Notify Manager
    try {
      const managers = await User.find({ role: 'Manager' });
      const notifications = managers.map(manager => ({
        user: manager._id,
        text: `Cancellation requested for Order #${order.orderId || order._id}`,
        icon: '⚠️'
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    res.json({ message: 'Cancellation request sent to manager for approval', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getSellerOrders,
  getAllOrders,
  updateOrderStatus,
  assignDelivery,
  getDeliveryPartners,
  getSellerStats,
  cancelOrder
};
