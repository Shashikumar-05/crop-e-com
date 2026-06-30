const Crop = require('../models/Crop');
const Message = require('../models/Message');
const Order = require('../models/Order');
const User = require('../models/User');
const { generateOrderId } = require('../utils/orderIdGenerator');
const sendEmail = require('../utils/sendEmail');
const { managerEnquiryTemplate, farmerEnquiryTemplate } = require('../utils/emailTemplates');

// @desc  Send bulk enquiries from buyer cart
// @route POST /api/enquiry
// @access Private (Buyer only)
const sendEnquiry = async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body; // [{ listingId, quantity }]
    const buyerId = req.user._id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items provided for enquiry.' });
    }

    const createdMessages = [];
    const ordersByFarmer = {};

    for (const item of items) {
      const { listingId, quantity } = item;

      // Fetch the crop to get farmer + crop details
      const crop = await Crop.findById(listingId).populate('farmerId', 'name email');
      if (!crop) continue;

      const farmerIdStr = crop.farmerId._id.toString();
      if (!ordersByFarmer[farmerIdStr]) {
        ordersByFarmer[farmerIdStr] = {
          farmer: crop.farmerId,
          items: [],
          totalAmount: 0
        };
      }

      const subtotal = crop.pricePerUnit * quantity;
      ordersByFarmer[farmerIdStr].items.push({
        listing: crop._id,
        farmer: crop.farmerId._id,
        cropName: crop.cropName,
        quantity,
        unit: crop.unit,
        pricePerUnit: crop.pricePerUnit,
        subtotal
      });
      ordersByFarmer[farmerIdStr].totalAmount += subtotal;

      const messageText = `I am interested in buying ${quantity} ${crop.unit} of ${crop.cropName} at ₹${crop.pricePerUnit}/${crop.unit}. Please contact me.`;

      const msg = await Message.create({
        buyer: buyerId,
        farmer: crop.farmerId._id,
        cropId: crop._id,
        cropName: crop.cropName,
        quantity,
        unit: crop.unit,
        pricePerUnit: crop.pricePerUnit,
        message: messageText
      });

      createdMessages.push(msg);

      // Send Email to Farmer
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      if (crop.farmerId.email) {
        await sendEmail({
          email: crop.farmerId.email,
          subject: '🌱 New Product Enquiry Received!',
          message: farmerEnquiryTemplate({
            farmerName: crop.farmerId.name,
            cropName: crop.cropName,
            quantity: quantity,
            unit: crop.unit,
            subtotal: subtotal,
            dashboardLink: `${frontendUrl}/seller/orders`
          })
        });
      }
    }

    // Fetch all managers for email notification
    const managers = await User.find({ role: 'Manager' }).select('email');

    // Create Inquiry Orders
    let ordersCreated = 0;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    for (const farmerIdStr in ordersByFarmer) {
      const group = ordersByFarmer[farmerIdStr];
      const orderIdData = await generateOrderId();
      
      const newOrder = await Order.create({
        ...orderIdData,
        buyer: buyerId,
        items: group.items,
        totalAmount: group.totalAmount,
        productTotal: group.totalAmount,
        deliveryAddress: deliveryAddress || '',
        orderStatus: 'Inquiry'
      });
      ordersCreated++;

      // Send Email to all Managers
      for (const manager of managers) {
        if (manager.email) {
          await sendEmail({
            email: manager.email,
            subject: `📦 New Order Enquiry (${newOrder.order_id})`,
            message: managerEnquiryTemplate({
              orderId: newOrder.order_id,
              buyerName: req.user.name,
              totalAmount: group.totalAmount,
              dashboardLink: `${frontendUrl}/manager`
            })
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      enquiriesSent: createdMessages.length,
      ordersCreated
    });
  } catch (error) {
    console.error('Enquiry error:', error);
    res.status(500).json({ message: 'Server error while sending enquiry.' });
  }
};

module.exports = { sendEnquiry };
