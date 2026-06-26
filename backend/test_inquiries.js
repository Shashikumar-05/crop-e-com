require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const orders = await Order.find({ orderStatus: 'Inquiry' }).lean();
  console.log(`Found ${orders.length} inquiries`);
  if (orders.length > 0) {
    console.log(orders[0]);
  }
  process.exit(0);
}
test();
