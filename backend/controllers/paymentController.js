const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const Order = require('../models/Order');
const Crop = require('../models/Crop');
const { generateOrderId } = require('../utils/orderIdGenerator');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc   Create Razorpay order
// @route  POST /api/payment/create-order
// @access Private (Buyer)
const createOrder = async (req, res) => {
  try {
    const { items, totalAmount } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate stock
    for (const item of items) {
      const crop = await Crop.findById(item._id);
      if (!crop) {
        return res.status(404).json({ message: `Product ${item.cropName} not found` });
      }
      if (crop.availableStock < item.cartQty) {
        return res.status(400).json({ message: `Insufficient stock for ${item.cropName}. Only ${crop.availableStock} ${item.unit} available.` });
      }
    }

    const options = {
      amount: Math.round(totalAmount * 100), // Razorpay uses paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    };

    if (!razorpay) {
      return res.status(503).json({ message: 'Online payments are currently disabled (Keys missing)' });
    }

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Razorpay create-order error:', error);
    res.status(500).json({ message: 'Failed to create payment order', error: error.message });
  }
};

// @desc   Verify Razorpay payment + save order
// @route  POST /api/payment/verify
// @access Private (Buyer)
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      totalAmount
    } = req.body;

    // Verify HMAC SHA256 signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.'
      });
    }

    // Build order items
    const orderItems = items.map(item => ({
      listing: item._id,
      farmer: item.farmerId?._id || item.farmerId,
      cropName: item.cropName,
      quantity: item.cartQty,
      unit: item.unit,
      pricePerUnit: item.pricePerUnit,
      subtotal: item.pricePerUnit * item.cartQty
    }));

    // Generate Monthly Resetting Order ID
    const orderIdData = await generateOrderId();

    // Save order to DB
    const savedOrder = await Order.create({
      ...orderIdData,
      buyer: req.user._id,
      items: orderItems,
      totalAmount,
      productTotal: totalAmount,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentStatus: 'Paid',
      orderStatus: 'Waiting for Manager Review'
    });

    // Deduct stock
    for (const item of items) {
      const crop = await Crop.findById(item._id);
      if (crop) {
        crop.availableStock -= item.cartQty;
        crop.soldQuantity += item.cartQty;
        if (crop.availableStock <= 0) {
          crop.availableStock = 0;
          crop.status = 'out_of_stock';
        }
        await crop.save();
      }
    }

    res.status(201).json({
      success: true,
      orderId: savedOrder._id,
      message: 'Payment verified and order placed successfully!'
    });

    // Generate Notifications
    try {
      const uniqueFarmers = [...new Set(orderItems.map(item => item.farmer.toString()))];
      const notifications = [];
      uniqueFarmers.forEach(farmerId => {
        notifications.push({
          user: farmerId,
          text: `You have a new order pending confirmation. Order ID: ${orderIdData.orderId}`,
          icon: '🔔'
        });
      });
      // Notify managers
      const managers = await User.find({ role: 'Manager' });
      managers.forEach(manager => {
        notifications.push({
          user: manager._id,
          text: `New order placed. Awaiting processing. Order ID: ${orderIdData.orderId}`,
          icon: '👔'
        });
      });
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }
  } catch (error) {
    console.error('Razorpay verify error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};

// @desc   Get buyer's orders
// @route  GET /api/payment/my-orders
// @access Private (Buyer)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.farmer', 'name phone')
      .populate('deliveryPartner', 'name phone liveLocation')
      .populate('vehicle', 'vehicle_type vehicle_number capacity_kg');
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// @desc   Create COD order
// @route  POST /api/payment/cod
// @access Private (Buyer)
const createCODOrder = async (req, res) => {
  try {
    const { items, totalAmount, deliveryAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate stock
    for (const item of items) {
      const crop = await Crop.findById(item._id);
      if (!crop) {
        return res.status(404).json({ message: `Product ${item.cropName} not found` });
      }
      if (crop.availableStock < item.cartQty) {
        return res.status(400).json({ message: `Insufficient stock for ${item.cropName}. Only ${crop.availableStock} ${item.unit} available.` });
      }
    }

    // Build order items
    const orderItems = items.map(item => ({
      listing: item._id,
      farmer: item.farmerId?._id || item.farmerId,
      cropName: item.cropName,
      quantity: item.cartQty,
      unit: item.unit,
      pricePerUnit: item.pricePerUnit,
      subtotal: item.pricePerUnit * item.cartQty
    }));

    // Generate Monthly Resetting Order ID
    const orderIdData = await generateOrderId();

    // Save order to DB
    const savedOrder = await Order.create({
      ...orderIdData,
      buyer: req.user._id,
      items: orderItems,
      totalAmount,
      productTotal: totalAmount,
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      orderStatus: 'Waiting for Manager Review',
      deliveryAddress: deliveryAddress || ''
    });

    // Deduct stock
    for (const item of items) {
      const crop = await Crop.findById(item._id);
      if (crop) {
        crop.availableStock -= item.cartQty;
        crop.soldQuantity += item.cartQty;
        if (crop.availableStock <= 0) {
          crop.availableStock = 0;
          crop.status = 'out_of_stock';
        }
        await crop.save();
      }
    }

    res.status(201).json({
      success: true,
      orderId: savedOrder._id,
      message: 'Order placed successfully via Cash on Delivery!'
    });

    // Generate Notifications
    try {
      const uniqueFarmers = [...new Set(orderItems.map(item => item.farmer.toString()))];
      const notifications = [];
      uniqueFarmers.forEach(farmerId => {
        notifications.push({
          user: farmerId,
          text: `You have a new COD order pending confirmation. Order ID: ${orderIdData.orderId}`,
          icon: '🔔'
        });
      });
      // Notify managers
      const managers = await User.find({ role: 'Manager' });
      managers.forEach(manager => {
        notifications.push({
          user: manager._id,
          text: `New COD order placed. Awaiting processing. Order ID: ${orderIdData.orderId}`,
          icon: '👔'
        });
      });
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }
  } catch (error) {
    console.error('COD order error:', error);
    res.status(500).json({ success: false, message: 'Server error creating COD order' });
  }
};

const payExistingOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!order.billConfirmed) return res.status(400).json({ message: 'Bill not confirmed yet' });

    const amount = order.grandTotal;
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${order._id}`
    };

    if (!razorpay) return res.status(503).json({ message: 'Online payments disabled' });
    const rpOrder = await razorpay.orders.create(options);

    res.status(200).json({
      orderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create payment order' });
  }
};

const verifyExistingPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString()).digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const order = await Order.findById(orderId);
    order.razorpay_order_id = razorpay_order_id;
    order.razorpay_payment_id = razorpay_payment_id;
    order.razorpay_signature = razorpay_signature;
    order.paymentMethod = 'Online';
    order.paymentStatus = 'Paid';
    order.orderStatus = 'Pending';
    await order.save();

    res.status(200).json({ success: true, message: 'Payment verified' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const payExistingCOD = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.paymentMethod = 'COD';
    order.paymentStatus = 'Pending';
    order.orderStatus = 'Pending';
    await order.save();

    res.status(200).json({ success: true, message: 'COD Confirmed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createOrder, verifyPayment, getMyOrders, createCODOrder, payExistingOrder, verifyExistingPayment, payExistingCOD };
