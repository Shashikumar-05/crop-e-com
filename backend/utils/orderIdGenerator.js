const Counter = require('../models/Counter');

const generateOrderId = async () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();
  
  // Unique counter ID for all orders
  const counterId = 'global_orders';

  // Atomically increment the sequence, or create it if it doesn't exist
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const sequenceNumber = counter.seq;
  
  // Format as simple string
  const orderId = sequenceNumber.toString();

  return {
    order_id: orderId,
    order_month: currentMonth,
    order_year: currentYear
  };
};

module.exports = { generateOrderId };
