const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Order = require('./models/Order');

// Load env vars
dotenv.config({ path: './.env' }); // Make sure path points to your .env

const syncWallets = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for sync...');

    // Reset all balances to 0 first (except totalWithdrawn, assuming they haven't withdrawn yet)
    await User.updateMany({}, { walletBalance: 0 });

    // Fetch all delivered orders
    const deliveredOrders = await Order.find({ orderStatus: 'Delivered' });

    for (const order of deliveredOrders) {
      // 1. Credit Delivery Partner 30Rs
      if (order.deliveryPartner) {
        await User.findByIdAndUpdate(order.deliveryPartner, { $inc: { walletBalance: 30 } });
      }

      // 2. Credit Seller
      if (order.items && order.items.length > 0) {
        const farmerId = order.items[0].farmer;
        if (farmerId) {
          await User.findByIdAndUpdate(farmerId, { $inc: { walletBalance: order.totalAmount || 0 } });
        }
      }
    }

    console.log(`Successfully synced wallet balances for ${deliveredOrders.length} delivered orders!`);
    process.exit(0);
  } catch (error) {
    console.error('Error syncing:', error);
    process.exit(1);
  }
};

syncWallets();
